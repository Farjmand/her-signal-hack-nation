import "dotenv/config"
import express from "express"
import cors from "cors"
import "./db.js"
import { capsulesRouter } from "./routes/capsules.js"

const app = express()
app.use(cors())
app.use(express.json())

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" })
})

app.use("/api/capsules", capsulesRouter)

const port = Number(process.env.PORT) || 4000
app.listen(port, () => {
  console.log(`HerSignal backend listening on http://localhost:${port}`)
})
