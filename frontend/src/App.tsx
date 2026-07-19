import type { ReactNode } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { AppHeader } from "@/components/AppHeader"
import { BottomNav } from "@/components/BottomNav"
import { CaptureScreen } from "@/screens/CaptureScreen"
import { ReviewScreen } from "@/screens/ReviewScreen"
import { EvidenceTimeline } from "@/screens/EvidenceTimeline"
import { ConsentScreen } from "@/screens/ConsentScreen"
import { ExportScreen } from "@/screens/ExportScreen"
import { WelcomeScreen } from "@/screens/WelcomeScreen"
import { hasStoredAge } from "@/lib/userProfile"

// Every other screen assumes a stored age is available (used for per-entry
// NHANES population context) -- redirect to onboarding rather than letting
// screens handle a missing age individually.
function RequireProfile({ children }: { readonly children: ReactNode }) {
  if (!hasStoredAge()) return <Navigate to="/welcome" replace />
  return children
}

function App() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#DCE3DF] p-0 sm:p-8 dark:bg-neutral-900">
      <div className="flex h-svh w-full flex-col overflow-hidden bg-background sm:h-[min(880px,calc(100svh-4rem))] sm:max-w-105 sm:rounded-[28px] sm:shadow-2xl sm:ring-1 sm:ring-black/5">
        <BrowserRouter>
          <AppHeader />
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/welcome" element={<WelcomeScreen />} />
              <Route
                path="/"
                element={
                  <RequireProfile>
                    <CaptureScreen />
                  </RequireProfile>
                }
              />
              <Route
                path="/review"
                element={
                  <RequireProfile>
                    <ReviewScreen />
                  </RequireProfile>
                }
              />
              <Route
                path="/timeline"
                element={
                  <RequireProfile>
                    <EvidenceTimeline />
                  </RequireProfile>
                }
              />
              <Route
                path="/consent"
                element={
                  <RequireProfile>
                    <ConsentScreen />
                  </RequireProfile>
                }
              />
              <Route
                path="/export"
                element={
                  <RequireProfile>
                    <ExportScreen />
                  </RequireProfile>
                }
              />
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
