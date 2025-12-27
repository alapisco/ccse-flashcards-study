import { strFromU8, strToU8, gzipSync, gunzipSync } from 'fflate'
import { Bytes } from 'firebase/firestore'

export type ExportPayloadV1 = {
  schemaVersion: 1
  datasetVersion: string
  createdAt: string
  lastUpdatedAt: string
  settings: unknown
  progressById: unknown
}

export function encodePayloadToGzip(payload: ExportPayloadV1): Uint8Array {
  const json = JSON.stringify(payload)
  const raw = strToU8(json)
  return gzipSync(raw)
}

export function encodePayloadToBytes(payload: ExportPayloadV1): Bytes {
  return Bytes.fromUint8Array(encodePayloadToGzip(payload))
}

export function decodePayloadFromBytes(bytes: Bytes): ExportPayloadV1 {
  const gz = bytes.toUint8Array()
  const raw = gunzipSync(gz)
  const json = strFromU8(raw)
  const parsed = JSON.parse(json) as ExportPayloadV1
  return parsed
}
