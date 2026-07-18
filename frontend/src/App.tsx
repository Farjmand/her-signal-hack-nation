import { BrowserRouter, Routes, Route } from "react-router"
import { CaptureScreen } from "@/screens/CaptureScreen"
import { ReviewScreen } from "@/screens/ReviewScreen"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CaptureScreen />} />
        <Route path="/review" element={<ReviewScreen />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
