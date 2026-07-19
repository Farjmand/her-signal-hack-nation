import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useSpeechRecognition } from "@/lib/useSpeechRecognition"

class FakeSpeechRecognition {
  continuous = false
  interimResults = false
  lang = ""
  onresult: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn(() => {
    this.onend?.()
  })
}

let fakeInstance: FakeSpeechRecognition

describe("useSpeechRecognition", () => {
  const originalSpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition

  beforeEach(() => {
    ;(window as unknown as Record<string, unknown>).SpeechRecognition = class {
      constructor() {
        fakeInstance = new FakeSpeechRecognition()
        return fakeInstance
      }
    }
  })

  afterEach(() => {
    ;(window as unknown as Record<string, unknown>).SpeechRecognition = originalSpeechRecognition
  })

  it("reports unsupported when no SpeechRecognition API exists", () => {
    ;(window as unknown as Record<string, unknown>).SpeechRecognition = undefined
    const { result } = renderHook(() => useSpeechRecognition({ onResult: vi.fn() }))
    expect(result.current.isSupported).toBe(false)
  })

  it("reports supported when SpeechRecognition API exists", () => {
    const { result } = renderHook(() => useSpeechRecognition({ onResult: vi.fn() }))
    expect(result.current.isSupported).toBe(true)
  })

  it("starts listening and flips isListening to true", () => {
    const { result } = renderHook(() => useSpeechRecognition({ onResult: vi.fn() }))
    act(() => {
      result.current.start()
    })
    expect(fakeInstance.start).toHaveBeenCalled()
    expect(result.current.isListening).toBe(true)
  })

  it("calls onResult with the final transcript when a result arrives", () => {
    const onResult = vi.fn()
    const { result } = renderHook(() => useSpeechRecognition({ onResult }))
    act(() => {
      result.current.start()
    })
    act(() => {
      fakeInstance.onresult?.({
        results: [[{ transcript: "sharp pelvic pain today" }]],
      })
    })
    expect(onResult).toHaveBeenCalledWith("sharp pelvic pain today")
  })

  it("stops listening and flips isListening back to false", () => {
    const { result } = renderHook(() => useSpeechRecognition({ onResult: vi.fn() }))
    act(() => {
      result.current.start()
    })
    act(() => {
      result.current.stop()
    })
    expect(fakeInstance.stop).toHaveBeenCalled()
    expect(result.current.isListening).toBe(false)
  })
})
