import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { CaptureScreen } from "@/screens/CaptureScreen"

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

describe("CaptureScreen voice entry", () => {
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

  it("shows a mic button when speech recognition is supported", () => {
    render(
      <MemoryRouter>
        <CaptureScreen />
      </MemoryRouter>
    )
    expect(screen.getByRole("button", { name: /record symptom by voice/i })).toBeInTheDocument()
  })

  it("hides the mic button when speech recognition is unsupported", () => {
    ;(window as unknown as Record<string, unknown>).SpeechRecognition = undefined
    ;(window as unknown as Record<string, unknown>).webkitSpeechRecognition = undefined
    render(
      <MemoryRouter>
        <CaptureScreen />
      </MemoryRouter>
    )
    expect(screen.queryByRole("button", { name: /record symptom by voice/i })).not.toBeInTheDocument()
  })

  it("appends the transcribed text to the textarea when a voice result arrives", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <CaptureScreen />
      </MemoryRouter>
    )
    await user.click(screen.getByRole("button", { name: /record symptom by voice/i }))
    act(() => {
      fakeInstance.onresult?.({
        resultIndex: 0,
        results: [Object.assign([{ transcript: "sharp pelvic pain today" }], { isFinal: true })],
      })
    })
    expect(screen.getByPlaceholderText(/e.g. i had sharp pelvic pain/i)).toHaveValue("sharp pelvic pain today")
  })
})
