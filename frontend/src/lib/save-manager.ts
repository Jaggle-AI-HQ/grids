import { useCallback, useEffect, useRef, useState } from 'react'
import { updateSpreadsheet } from './api'

/** Minimal interface for the IronCalc Model – avoids coupling to a specific @ironcalc/wasm version */
interface SerialisableModel {
  toBytes(): Uint8Array
}

// ──────────────────────────────────────────────
// Save status exposed to the UI
// ──────────────────────────────────────────────

export type SaveStatus =
  | 'idle'       // no changes since last save
  | 'unsaved'    // there are pending changes
  | 'saving'     // a network request is in flight
  | 'saved'      // last save succeeded (briefly shown, then → idle)
  | 'error'      // last save failed

export interface SaveManagerState {
  status: SaveStatus
  /** Human-readable error when status === 'error' */
  errorMessage: string | null
  /** Trigger an immediate save (for the Save button / Ctrl+S) */
  saveNow: () => Promise<void>
  /** Call this whenever the model may have been mutated */
  markDirty: () => void
  /** Seed the last-saved snapshot so the first render doesn't trigger a save */
  setInitialSnapshot: () => void
  /** Number of consecutive failures (for UI hints) */
  failureCount: number
}

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

/** How long to wait after the last mutation before auto-saving */
const DEBOUNCE_MS = 1_500

/** Delay before the "Saved" badge reverts to idle */
const SAVED_BADGE_MS = 2_500

/** Minimum interval between serialisation-based dirty checks */
const DIRTY_CHECK_THROTTLE_MS = 300

/** Maximum retry attempts before giving up until the next mutation */
const MAX_RETRIES = 3

/** Base delay between retries – doubled each attempt */
const RETRY_BASE_MS = 1_000

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export function useSaveManager(
  spreadsheetId: number | null,
  modelRef: React.RefObject<SerialisableModel | null>,
): SaveManagerState {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [failureCount, setFailureCount] = useState(0)

  // Mutable refs so callbacks always see the latest values
  // without re-creating closures.
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedBadgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSaving = useRef(false)
  const pendingWhileSaving = useRef(false)
  const retryCount = useRef(0)
  const lastSavedPayload = useRef<string | null>(null)
  const dirtyCheckThrottled = useRef(false)
  const statusRef = useRef(status)
  statusRef.current = status

  // ── Serialise model to base64 ──────────────
  const serialiseModel = useCallback((): string | null => {
    const model = modelRef.current
    if (!model) return null
    try {
      const bytes = model.toBytes()
      // Use chunked btoa to avoid call-stack overflow on large workbooks
      let binary = ''
      const chunkSize = 8192
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize)
        binary += String.fromCharCode(...chunk)
      }
      return btoa(binary)
    } catch {
      return null
    }
  }, [modelRef])

  // ── Core persist function ──────────────────
  const persist = useCallback(async (): Promise<boolean> => {
    if (!spreadsheetId || isSaving.current) {
      // If already saving, mark that another save is needed once done.
      if (isSaving.current) pendingWhileSaving.current = true
      return false
    }

    const payload = serialiseModel()
    if (payload === null) return false

    // Skip the network request if the model hasn't actually changed
    if (payload === lastSavedPayload.current) {
      setStatus('idle')
      return true
    }

    isSaving.current = true
    setStatus('saving')
    setErrorMessage(null)

    try {
      await updateSpreadsheet(spreadsheetId, { data: payload })

      // Success
      isSaving.current = false
      retryCount.current = 0
      lastSavedPayload.current = payload
      setFailureCount(0)
      setStatus('saved')

      // Revert badge to idle after a short delay
      if (savedBadgeTimer.current) clearTimeout(savedBadgeTimer.current)
      savedBadgeTimer.current = setTimeout(() => {
        // Only revert if nothing else changed the status in the meantime.
        setStatus((prev) => (prev === 'saved' ? 'idle' : prev))
      }, SAVED_BADGE_MS)

      // If new mutations arrived while we were saving, schedule again.
      if (pendingWhileSaving.current) {
        pendingWhileSaving.current = false
        scheduleSave()
      }

      return true
    } catch (err) {
      isSaving.current = false
      retryCount.current += 1
      const count = retryCount.current
      setFailureCount(count)

      if (count < MAX_RETRIES) {
        // Retry with exponential backoff
        const delay = RETRY_BASE_MS * Math.pow(2, count - 1)
        debounceTimer.current = setTimeout(() => {
          persist()
        }, delay)
        // Keep status as 'saving' during retries so the user sees activity
        return false
      }

      // Give up – surface the error
      setStatus('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save. Your changes are preserved locally.',
      )
      return false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreadsheetId, serialiseModel])

  // ── Schedule a debounced save ──────────────
  const scheduleSave = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      persist()
    }, DEBOUNCE_MS)
  }, [persist])

  // ── Public: mark the model as dirty ────────
  const markDirty = useCallback(() => {
    // Throttle serialisation checks to avoid expensive toBytes() on every DOM event
    if (dirtyCheckThrottled.current) return
    dirtyCheckThrottled.current = true
    setTimeout(() => { dirtyCheckThrottled.current = false }, DIRTY_CHECK_THROTTLE_MS)

    // Quick-check: if the model hasn't actually changed, do nothing.
    const current = serialiseModel()
    if (current !== null && current === lastSavedPayload.current) return

    // Reset retry state on new user activity
    if (statusRef.current === 'error') {
      retryCount.current = 0
      setFailureCount(0)
    }
    setStatus('unsaved')
    setErrorMessage(null)
    scheduleSave()
  }, [scheduleSave, serialiseModel])

  // ── Public: immediate save (button / Ctrl+S)
  const saveNow = useCallback(async () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    await persist()
  }, [persist])

  // ── Public: seed snapshot after initial load ─
  const setInitialSnapshot = useCallback(() => {
    lastSavedPayload.current = serialiseModel()
  }, [serialiseModel])

  // ── beforeunload: warn the user if there are unsaved changes
  //
  // We can't reliably save here because sendBeacon doesn't support
  // custom headers (needed for Bearer auth). Instead we:
  //   1. Show the browser's native "unsaved changes" dialog
  //   2. Rely on the debounced auto-save + visibilitychange handler
  //      having already persisted the latest state
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (statusRef.current === 'unsaved' || statusRef.current === 'saving') {
        e.preventDefault()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // ── visibilitychange: save when tab goes hidden
  useEffect(() => {
    function handleVisibility() {
      if (
        document.visibilityState === 'hidden' &&
        (statusRef.current === 'unsaved' || statusRef.current === 'error')
      ) {
        // Fire-and-forget – best effort
        persist()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [persist])

  // ── Cleanup timers on unmount ──────────────
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      if (savedBadgeTimer.current) clearTimeout(savedBadgeTimer.current)
    }
  }, [])

  return { status, errorMessage, saveNow, markDirty, setInitialSnapshot, failureCount }
}
