import { test } from "node:test"
import assert from "node:assert/strict"
import express from "express"
import type { AddressInfo } from "node:net"
import { populationContextRouter } from "./populationContext.js"

async function withServer(fn: (baseUrl: string) => Promise<void>) {
  const app = express()
  app.use("/api/population-context", populationContextRouter)
  const server = app.listen(0)
  await new Promise<void>((resolve) => server.once("listening", resolve))
  const { port } = server.address() as AddressInfo
  try {
    await fn(`http://127.0.0.1:${port}/api/population-context`)
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

test("returns a population-level age-band distribution for a valid age", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}?age=30`)
    assert.equal(res.status, 200)
    const body = (await res.json()) as Record<string, unknown>
    assert.ok(typeof body.ageBand === "string")
    assert.ok(typeof body.n === "number")
    assert.ok(typeof body.distribution === "object")
    assert.ok(typeof body.source === "string")
    assert.ok(typeof body.disclaimer === "string")
  })
})

test("rejects an age below the supported range (17) with 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}?age=17`)
    assert.equal(res.status, 400)
  })
})

test("rejects an age above the supported range (60) with 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}?age=60`)
    assert.equal(res.status, 400)
  })
})

test("rejects a non-numeric age with 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}?age=abc`)
    assert.equal(res.status, 400)
  })
})

test("rejects a missing age param with 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(baseUrl)
    assert.equal(res.status, 400)
  })
})

test("never mentions the requester individually -- response is population statistics only", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}?age=45`)
    const body = await res.json()
    const text = JSON.stringify(body).toLowerCase()
    assert.ok(!text.includes("you "), "response should not address the user directly")
    assert.ok(!text.includes("your "), "response should not address the user directly")
  })
})
