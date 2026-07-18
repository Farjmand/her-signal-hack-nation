import { BrowserRouter, Routes, Route } from "react-router"
import { CaptureScreen } from "@/screens/CaptureScreen"
import { ReviewScreen } from "@/screens/ReviewScreen"
import { EvidenceTimeline } from "@/screens/EvidenceTimeline"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CaptureScreen />} />
        <Route path="/review" element={<ReviewScreen />} />
        <Route path="/timeline" element={<EvidenceTimeline />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
