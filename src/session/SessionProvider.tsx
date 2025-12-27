import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { Bytes, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { useAppStore } from '../store/useAppStore'
import { decodePayloadFromBytes, encodePayloadToGzip, type ExportPayloadV1 } from './cloudCodec'
import { auth, db, googleProvider } from './firebase'
import { fetchSystemConfig, type SystemConfig } from './systemConfig'

const CAPACITY_THRESHOLD_BYTES = 950_000_000
const MAX_BACKUP_BYTES = 512_000

export type ConflictState = {
  cloud: ExportPayloadV1
}

export type SessionState = {
  user: User | null
  authLoading: boolean

  system: SystemConfig | null
  systemLoading: boolean

  atCapacity: boolean
  registrationEnabled: boolean

  userDocExists: boolean

  conflict: ConflictState | null

  statusMessage: string | null
  errorMessage: string | null

  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>

  syncNow: () => Promise<void>
  downloadCloud: () => Promise<void>
  overwriteCloudWithLocal: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

function isoToMs(iso: string | null | undefined) {
  if (!iso) return 0
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? ms : 0
}

function formatFirebaseishError(e: unknown) {
  if (e && typeof e === 'object' && 'code' in e && typeof (e as any).code === 'string') {
    const code = (e as any).code as string
    if (code === 'permission-denied') return 'Permisos insuficientes en Firestore (revisa las rules).' 
    return `Error de Firebase: ${code}`
  }
  return e instanceof Error ? e.message : 'Error desconocido'
}

function getCloudUpdatedAt(payload: Partial<ExportPayloadV1> | null | undefined) {
  const lastUpdatedAt = typeof payload?.lastUpdatedAt === 'string' ? payload.lastUpdatedAt : null
  if (lastUpdatedAt) return lastUpdatedAt

  const createdAt = typeof payload?.createdAt === 'string' ? payload.createdAt : null
  if (createdAt) return createdAt

  return null
}

export function SessionProvider(props: { children: React.ReactNode }) {
  const exportPayload = useAppStore((s) => s.exportPayload)
  const importPayload = useAppStore((s) => s.importPayload)
  const localLastUpdatedAt = useAppStore((s) => s.lastUpdatedAt)
  const localProgressCount = useAppStore((s) => Object.keys(s.progressById).length)

  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [system, setSystem] = useState<SystemConfig | null>(null)
  const [systemLoading, setSystemLoading] = useState(true)

  const [userDocExists, setUserDocExists] = useState(false)
  const [conflict, setConflict] = useState<ConflictState | null>(null)

  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const cloudLastUpdatedAtRef = useRef<string | null>(null)
  const lastSeenRemoteUpdatedAtRef = useRef<string | null>(null)
  const initializedForUidRef = useRef<string | null>(null)
  const uploadDebounceRef = useRef<number | null>(null)

  const registrationEnabled = system?.registration_enabled ?? true
  const atCapacity = (system?.total_usage_bytes ?? 0) > CAPACITY_THRESHOLD_BYTES

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    let cancelled = false
    setSystemLoading(true)
    fetchSystemConfig()
      .then((cfg) => {
        if (cancelled) return
        setSystem(cfg)
      })
      .catch((e) => {
        if (cancelled) return
        setErrorMessage(e instanceof Error ? e.message : 'Error loading system config')
      })
      .finally(() => {
        if (cancelled) return
        setSystemLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!user) {
      initializedForUidRef.current = null
      cloudLastUpdatedAtRef.current = null
      setUserDocExists(false)
      setConflict(null)
      setStatusMessage(null)
      return
    }

    const currentUser = user

    let cancelled = false

    async function bootstrapForUser() {
      setErrorMessage(null)
      setStatusMessage(null)

      const uid = currentUser.uid
      if (initializedForUidRef.current === uid) return
      initializedForUidRef.current = uid

      const ref = doc(db, 'users', uid)
      const snap = await getDoc(ref)

      if (!registrationEnabled && !snap.exists()) {
        await firebaseSignOut(auth)
        if (!cancelled) {
          setErrorMessage('Registro deshabilitado: esta cuenta no está habilitada para este servicio.')
        }
        return
      }

      if (cancelled) return

      setUserDocExists(snap.exists())

      const data = snap.data() as { progress_blob?: Bytes } | undefined
      const blob = data?.progress_blob

      const localState = useAppStore.getState()
      const localHasProgress = Object.keys(localState.progressById).length > 0
      const localMs = isoToMs(localState.lastUpdatedAt)

      if (!blob) {
        cloudLastUpdatedAtRef.current = null

        if (localHasProgress && !atCapacity) {
          await uploadNow({ allowCreate: registrationEnabled })
          if (!cancelled) setStatusMessage('Copia en la nube creada automáticamente.')
        }
        return
      }

      let cloud: ExportPayloadV1
      try {
        cloud = decodePayloadFromBytes(blob)
      } catch {
        setErrorMessage('No se pudo leer la copia de la nube (datos corruptos).')
        return
      }

      const cloudUpdatedAt = getCloudUpdatedAt(cloud)
      cloudLastUpdatedAtRef.current = cloudUpdatedAt
      const cloudMs = isoToMs(cloudUpdatedAt)

      if (!localHasProgress) {
        const result = importPayload(cloud)
        if (!cancelled) {
          setStatusMessage(result.ok ? 'Progreso descargado desde la nube.' : `Error: ${result.reason}`)
        }
        return
      }

      if (cloudMs > localMs) {
        const result = importPayload(cloud)
        if (!cancelled) {
          setConflict(null)
          setStatusMessage(result.ok ? 'Progreso actualizado desde la nube.' : `Error: ${result.reason}`)
        }
        return
      }

      if (localMs > cloudMs && !atCapacity) {
        await uploadNow({ allowCreate: registrationEnabled || snap.exists() })
        if (!cancelled) setStatusMessage('Progreso local más reciente: sincronizado a la nube.')
      }
    }

    bootstrapForUser().catch((e) => {
      if (cancelled) return
      setErrorMessage(e instanceof Error ? e.message : 'Error inicializando la sesión')
    })

    return () => {
      cancelled = true
    }
  }, [user, registrationEnabled, atCapacity, importPayload])

  // Realtime: if another device uploads a newer cloud backup while this device is logged in,
  // show the same conflict prompt (or auto-download if this device is empty).
  useEffect(() => {
    if (!user) return

    const ref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setUserDocExists(snap.exists())

        const data = snap.data() as { progress_blob?: Bytes } | undefined
        const blob = data?.progress_blob
        if (!blob) return

        let cloud: ExportPayloadV1
        try {
          cloud = decodePayloadFromBytes(blob)
        } catch {
          // Ignore corrupt payloads in background listener; the user can still manual-download
          // and see the error from the explicit action.
          return
        }

        const remoteUpdatedAt = getCloudUpdatedAt(cloud)
        if (!remoteUpdatedAt) return

        // Prevent re-processing the same cloud update repeatedly.
        if (lastSeenRemoteUpdatedAtRef.current === remoteUpdatedAt) return
        lastSeenRemoteUpdatedAtRef.current = remoteUpdatedAt

        cloudLastUpdatedAtRef.current = remoteUpdatedAt

        const localState = useAppStore.getState()

        const cloudMs = isoToMs(remoteUpdatedAt)
        const localMs = isoToMs(localState.lastUpdatedAt)

        if (cloudMs <= localMs) return

        const result = importPayload(cloud)
        setConflict(null)
        setStatusMessage(result.ok ? 'Progreso actualizado desde la nube.' : `Error: ${result.reason}`)
      },
      () => {
        // Keep silent; permission issues will surface on explicit sync.
      },
    )

    return () => {
      unsub()
    }
  }, [user, importPayload])

  async function uploadNow(args: { allowCreate: boolean }) {
    if (!user) return
    if (atCapacity) throw new Error('Servicio en capacidad: sincronización deshabilitada.')

    const uid = user.uid
    const ref = doc(db, 'users', uid)

    if (!args.allowCreate) {
      const snap = await getDoc(ref)
      if (!snap.exists()) throw new Error('Registro deshabilitado para usuarios nuevos.')
    }

    const payload = exportPayload() as ExportPayloadV1
    const gz = encodePayloadToGzip(payload)

    if (gz.length > MAX_BACKUP_BYTES) {
      throw new Error('Backup demasiado grande (máximo 500KB comprimido).')
    }

    await setDoc(ref, { progress_blob: Bytes.fromUint8Array(gz) }, { merge: true })

    cloudLastUpdatedAtRef.current = payload.lastUpdatedAt
    setUserDocExists(true)
  }

  async function flushUploadIfNeeded() {
    if (!user) return
    if (atCapacity) return
    if (conflict) return
    if (localProgressCount === 0) return

    const cloudMs = isoToMs(cloudLastUpdatedAtRef.current)
    const localMs = isoToMs(useAppStore.getState().lastUpdatedAt)
    if (localMs <= cloudMs) return

    if (uploadDebounceRef.current) {
      window.clearTimeout(uploadDebounceRef.current)
      uploadDebounceRef.current = null
    }

    await uploadNow({ allowCreate: registrationEnabled || userDocExists })
  }

  async function downloadNow() {
    if (!user) return
    const uid = user.uid
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new Error('No hay copia en la nube para esta cuenta.')

    const data = snap.data() as { progress_blob?: Bytes }
    const blob = data.progress_blob
    if (!blob) throw new Error('No hay copia en la nube para esta cuenta.')

    const cloud = decodePayloadFromBytes(blob)
    importPayload(cloud)

    cloudLastUpdatedAtRef.current = cloud.lastUpdatedAt
    setUserDocExists(true)
    setConflict(null)
  }

  useEffect(() => {
    if (!user) return
    if (atCapacity) return
    if (conflict) return

    // Never auto-upload an empty progress state; this avoids accidentally wiping an existing
    // cloud backup after a local reset. Manual "Sincronizar ahora" still allows it.
    if (localProgressCount === 0) return

    const cloudMs = isoToMs(cloudLastUpdatedAtRef.current)
    const localMs = isoToMs(localLastUpdatedAt)
    if (localMs <= cloudMs) return

    if (uploadDebounceRef.current) {
      window.clearTimeout(uploadDebounceRef.current)
    }

    uploadDebounceRef.current = window.setTimeout(() => {
      uploadNow({ allowCreate: registrationEnabled || userDocExists }).catch((e) => {
        setErrorMessage(e instanceof Error ? e.message : 'Error sincronizando')
      })
    }, 400)

    return () => {
      if (uploadDebounceRef.current) {
        window.clearTimeout(uploadDebounceRef.current)
        uploadDebounceRef.current = null
      }
    }
  }, [user, localLastUpdatedAt, localProgressCount, atCapacity, conflict, registrationEnabled, userDocExists])

  const value = useMemo<SessionState>(
    () => ({
      user,
      authLoading,
      system,
      systemLoading,
      atCapacity,
      registrationEnabled,
      userDocExists,
      conflict,
      statusMessage,
      errorMessage,
      signInWithGoogle: async () => {
        setErrorMessage(null)
        setStatusMessage(null)
        await signInWithPopup(auth, googleProvider)
      },
      signOut: async () => {
        setErrorMessage(null)
        setStatusMessage(null)
        try {
          await flushUploadIfNeeded()
        } catch (e) {
          setErrorMessage(e instanceof Error ? e.message : 'Error sincronizando antes de salir')
        }
        await firebaseSignOut(auth)
      },
      syncNow: async () => {
        setErrorMessage(null)
        setStatusMessage(null)
        try {
          await uploadNow({ allowCreate: registrationEnabled || userDocExists })
          setStatusMessage('Sincronizado a la nube.')
        } catch (e) {
          setErrorMessage(formatFirebaseishError(e))
        }
      },
      downloadCloud: async () => {
        setErrorMessage(null)
        setStatusMessage(null)
        try {
          await downloadNow()
          setStatusMessage('Progreso descargado desde la nube.')
        } catch (e) {
          setErrorMessage(formatFirebaseishError(e))
        }
      },
      overwriteCloudWithLocal: async () => {
        setErrorMessage(null)
        setStatusMessage(null)
        try {
          setConflict(null)
          await uploadNow({ allowCreate: registrationEnabled || userDocExists })
          setStatusMessage('Nube sobrescrita con el progreso local.')
        } catch (e) {
          setErrorMessage(formatFirebaseishError(e))
        }
      },
    }),
    [
      user,
      authLoading,
      system,
      systemLoading,
      atCapacity,
      registrationEnabled,
      userDocExists,
      conflict,
      statusMessage,
      errorMessage,
    ],
  )

  return <SessionContext.Provider value={value}>{props.children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
