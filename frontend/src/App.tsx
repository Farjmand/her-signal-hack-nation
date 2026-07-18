import { BrowserRouter, Routes, Route } from "react-router"
import { CaptureScreen } from "@/screens/CaptureScreen"
import { ReviewScreen } from "@/screens/ReviewScreen"
import { EvidenceTimeline } from "@/screens/EvidenceTimeline"
import { ConsentScreen } from "@/screens/ConsentScreen"
import { ExportScreen } from "@/screens/ExportScreen"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CaptureScreen />} />
        <Route path="/review" element={<ReviewScreen />} />
        <Route path="/timeline" element={<EvidenceTimeline />} />
        <Route path="/consent" element={<ConsentScreen />} />
        <Route path="/export" element={<ExportScreen />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
