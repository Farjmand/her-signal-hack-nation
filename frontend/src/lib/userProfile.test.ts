import { describe, it, expect, beforeEach } from "vitest"
import { getStoredAge, setStoredAge, hasStoredAge } from "@/lib/userProfile"

describe("userProfile local age storage", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("returns null when no age has been stored", () => {
    expect(getStoredAge()).toBeNull()
    expect(hasStoredAge()).toBe(false)
  })

  it("returns the stored age after setStoredAge", () => {
    setStoredAge(34)
    expect(getStoredAge()).toBe(34)
    expect(hasStoredAge()).toBe(true)
  })

  it("returns null if the stored value is somehow non-numeric, rather than throwing", () => {
    localStorage.setItem("hersignal:user_age", "not-a-number")
    expect(getStoredAge()).toBeNull()
    expect(hasStoredAge()).toBe(false)
  })

  it("overwrites a previously stored age rather than accumulating", () => {
    setStoredAge(30)
    setStoredAge(45)
    expect(getStoredAge()).toBe(45)
  })
})
