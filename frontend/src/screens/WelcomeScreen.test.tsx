import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { WelcomeScreen } from "@/screens/WelcomeScreen"
import { getStoredAge } from "@/lib/userProfile"

const navigateMock = vi.fn()
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router")
  return { ...actual, useNavigate: () => navigateMock }
})

describe("WelcomeScreen", () => {
  beforeEach(() => {
    localStorage.clear()
    navigateMock.mockReset()
  })

  it("does not let you continue without entering an age", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <WelcomeScreen />
      </MemoryRouter>
    )
    await user.click(screen.getByRole("button", { name: /continue/i }))
    expect(getStoredAge()).toBeNull()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it("stores the age locally and navigates home on submit", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <WelcomeScreen />
      </MemoryRouter>
    )
    await user.type(screen.getByLabelText(/age/i), "34")
    await user.click(screen.getByRole("button", { name: /continue/i }))

    expect(getStoredAge()).toBe(34)
    expect(navigateMock).toHaveBeenCalledWith("/", { replace: true })
  })

  it("never renders a name field -- age-only by design", () => {
    render(
      <MemoryRouter>
        <WelcomeScreen />
      </MemoryRouter>
    )
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
  })
})
