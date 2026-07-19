import { BrowserRouter, Routes, Route } from "react-router"
import { AppHeader } from "@/components/AppHeader"
import { BottomNav } from "@/components/BottomNav"
import { CaptureScreen } from "@/screens/CaptureScreen"
import { ReviewScreen } from "@/screens/ReviewScreen"
import { EvidenceTimeline } from "@/screens/EvidenceTimeline"
import { ConsentScreen } from "@/screens/ConsentScreen"
import { ExportScreen } from "@/screens/ExportScreen"

function App() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#DCE3DF] p-0 sm:p-8 dark:bg-neutral-900">
      <div className="flex h-svh w-full flex-col overflow-hidden bg-background sm:h-[min(880px,calc(100svh-4rem))] sm:max-w-105 sm:rounded-[28px] sm:shadow-2xl sm:ring-1 sm:ring-black/5">
        <BrowserRouter>
          <AppHeader />
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<CaptureScreen />} />
              <Route path="/review" element={<ReviewScreen />} />
              <Route path="/timeline" element={<EvidenceTimeline />} />
              <Route path="/consent" element={<ConsentScreen />} />
              <Route path="/export" element={<ExportScreen />} />
            </Routes>
          </div>
          <p className="shrink-0 border-t border-border bg-card px-3 py-1.5 text-center text-[9px] text-muted-foreground">
            Not medical advice · synthetic demo data
          </p>
          <BottomNav />
        </BrowserRouter>
      </div>
    </div>
  )
}

export default App
