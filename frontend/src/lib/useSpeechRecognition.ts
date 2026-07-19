import { useCallback, useEffect, useRef, useState } from "react"

interface SpeechRecognitionResultLike {
  transcript: string
}

interface SpeechRecognitionResultListItemLike extends ArrayLike<SpeechRecognitionResultLike> {
  isFinal: boolean
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultListItemLike>
}

interface SpeechRecognitionErrorEventLike {
  error: string
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  onaudiostart: (() => void) | null
  start: () => void
  stop: () => void
}

const SPEECH_ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow it in your browser settings and try again.",
  "service-not-allowed": "Microphone access was blocked. Allow it in your browser settings and try again.",
  "no-speech": "Didn't catch that — no speech detected. Try again.",
  "audio-capture": "No microphone found. Check your device and try again.",
  network: "Voice recognition needs an internet connection. Try again or type your note.",
  aborted: ""
}

// Only guards against the recognition service never responding at all —
// cleared as soon as we see any sign of life (audio starting or a result),
// so it never cuts off an in-progress recording.
const STARTUP_TIMEOUT_MS = 12000

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined
}

interface UseSpeechRecognitionOptions {
  onResult: (transcript: string) => void
}

export function useSpeechRecognition({ onResult }: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const startupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSupported = getSpeechRecognitionConstructor() !== undefined

  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  const clearStartupTimer = useCallback(() => {
    if (startupTimeoutRef.current !== null) {
      clearTimeout(startupTimeoutRef.current)
      startupTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearStartupTimer()
      recognitionRef.current?.stop()
    }
  }, [clearStartupTimer])

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor()
    if (!Ctor) {
      setError("Voice capture isn't supported in this browser. Try Chrome or Edge, or type your note.")
      return
    }

    // Guard against a second start() before the first session produced any
    // event (e.g. a rapid double-tap): clear the pending watchdog and tear
    // down the old instance so its timer can't fire later against an
    // instance we've already replaced.
    clearStartupTimer()
    recognitionRef.current?.stop()
    setError(null)

    const recognition = new Ctor()
    // continuous=true: keep listening across pauses instead of stopping the
    // instant the browser detects a lull — that's what was cutting people
    // off mid-sentence. We stop it ourselves (button or unmount) instead.
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = "en-US"
    recognition.onaudiostart = () => {
      clearStartupTimer()
    }
    recognition.onresult = (event) => {
      clearStartupTimer()
      let finalTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result?.isFinal) {
          const chunk = result[0]?.transcript ?? ""
          finalTranscript = finalTranscript ? `${finalTranscript} ${chunk}` : chunk
        }
      }
      finalTranscript = finalTranscript.trim()
      if (finalTranscript) onResultRef.current(finalTranscript)
    }
    recognition.onerror = (event) => {
      clearStartupTimer()
      const message = SPEECH_ERROR_MESSAGES[event.error]
      if (message === undefined) {
        setError("Voice capture failed. Try again or type your note.")
      } else if (message) {
        setError(message)
      }
      setIsListening(false)
    }
    recognition.onend = () => {
      clearStartupTimer()
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)

    startupTimeoutRef.current = setTimeout(() => {
      setError("Voice capture timed out. Try again or type your note.")
      recognitionRef.current?.stop()
      setIsListening(false)
    }, STARTUP_TIMEOUT_MS)
  }, [clearStartupTimer])

  const stop = useCallback(() => {
    clearStartupTimer()
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [clearStartupTimer])

  return { isSupported, isListening, error, start, stop }
}
