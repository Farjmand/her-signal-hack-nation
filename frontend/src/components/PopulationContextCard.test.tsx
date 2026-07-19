import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PopulationContextCard } from "@/components/PopulationContextCard"
import { fetchPopulationContext } from "@/lib/api"

vi.mock("@/lib/api", () => ({
  fetchPopulationContext: vi.fn()
}))

const mockFetch = vi.mocked(fetchPopulationContext)

describe("PopulationContextCard", () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it("does not fetch anything until the user submits an age", () => {
    render(<PopulationContextCard />)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("shows the population distribution after submitting a valid age", async () => {
    mockFetch.mockResolvedValue({
      ageBand: "43-47",
      n: 191,
      distribution: { premenopausal: 0.77, postmenopausal: 0.23 },
      source: "NHANES 2017-2018 national survey (RHQ_J + DEMO_J)",
      disclaimer: "Population-level statistics from a real national survey -- not clinical validation, not a diagnosis, and not a prediction about any individual."
    })

    const user = userEvent.setup()
    render(<PopulationContextCard />)

    await user.type(screen.getByLabelText(/age/i), "45")
    await user.click(screen.getByRole("button", { name: /show/i }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(45))
    expect(await screen.findByText(/43-47/)).toBeInTheDocument()
    expect(screen.getByText(/not a prediction about any individual/i)).toBeInTheDocument()
  })

  it("shows an error message when the lookup fails", async () => {
    mockFetch.mockRejectedValue(new Error("age must be a whole number between 18 and 59"))

    const user = userEvent.setup()
    render(<PopulationContextCard />)

    await user.type(screen.getByLabelText(/age/i), "5")
    await user.click(screen.getByRole("button", { name: /show/i }))

    expect(await screen.findByText(/age must be a whole number between 18 and 59/i)).toBeInTheDocument()
  })
})
