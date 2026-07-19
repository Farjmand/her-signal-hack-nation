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
  onaudiostart: (() => void) | null = null
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
        resultIndex: 0,
        results: [Object.assign([{ transcript: "sharp pelvic pain today" }], { isFinal: true })],
      })
    })
    expect(onResult).toHaveBeenCalledWith("sharp pelvic pain today")
  })

  it("sets continuous mode so recognition doesn't auto-stop on a pause", () => {
    const { result } = renderHook(() => useSpeechRecognition({ onResult: vi.fn() }))
    act(() => {
      result.current.start()
    })
    expect(fakeInstance.continuous).toBe(true)
  })

  it("only reports new final results, without re-sending earlier ones", () => {
    const onResult = vi.fn()
    const { result } = renderHook(() => useSpeechRecognition({ onResult }))
    act(() => {
      result.current.start()
    })
    act(() => {
      fakeInstance.onresult?.({
        resultIndex: 0,
        results: [Object.assign([{ transcript: "sharp pelvic pain" }], { isFinal: true })],
      })
    })
    act(() => {
      fakeInstance.onresult?.({
        resultIndex: 1,
        results: [
          Object.assign([{ transcript: "sharp pelvic pain" }], { isFinal: true }),
          Object.assign([{ transcript: "and slept four hours" }], { isFinal: true }),
        ],
      })
    })
    expect(onResult).toHaveBeenNthCalledWith(1, "sharp pelvic pain")
    expect(onResult).toHaveBeenNthCalledWith(2, "and slept four hours")
    expect(onResult).toHaveBeenCalledTimes(2)
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
