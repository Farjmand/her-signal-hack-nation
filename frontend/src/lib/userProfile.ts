/**
 * Local-only user age storage. Deliberately never sent to the backend as
 * part of any capsule, consent, or export -- used only to look up the
 * per-entry NHANES population context on the client. Keeps the app's
 * no-identifiers design intact (no name, nothing persisted server-side).
 */
const AGE_STORAGE_KEY = "hersignal:user_age"

export function getStoredAge(): number | null {
  const raw = localStorage.getItem(AGE_STORAGE_KEY)
  if (raw === null) return null
  const age = Number(raw)
  return Number.isFinite(age) ? age : null
}

export function setStoredAge(age: number): void {
  localStorage.setItem(AGE_STORAGE_KEY, String(age))
}

export function hasStoredAge(): boolean {
  return getStoredAge() !== null
}
