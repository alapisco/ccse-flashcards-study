import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export type SystemConfig = {
  registration_enabled: boolean
  total_usage_bytes: number
}

export async function fetchSystemConfig(): Promise<SystemConfig> {
  const ref = doc(db, 'config', 'system')
  const snap = await getDoc(ref)

  const registration_enabled = snap.exists() ? Boolean(snap.data().registration_enabled) : true
  const total_usage_bytes = snap.exists() ? Number(snap.data().total_usage_bytes ?? 0) : 0

  return { registration_enabled, total_usage_bytes }
}
