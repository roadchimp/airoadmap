import { Routes, Route, Outlet } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "../../components/ui/tooltip"
import { queryClient } from "../../lib/queryClient"
import AppLayout from "../../app/(app)/layout"
import NotFound from "./pages/not-found"
import Dashboard from "./pages/Dashboard"
import NewAssessment from "./pages/NewAssessment"
import PreviousReports from "./pages/PreviousReports"
import ReportDetails from "./pages/ReportDetails"
import Library from "./pages/Library"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import DebugEnvPage from "./pages/DebugEnvPage"

const ProtectedLayout = () => {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

export function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          
          {/* Temporary Debug Route - REMOVE AFTER USE */}
          <Route path="/debug-env" element={<DebugEnvPage />} />
          
          {/* Protected routes - wrapped in AppLayout */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assessment/new" element={<NewAssessment />} />
            <Route path="/assessment/:step" element={<NewAssessment />} />
            <Route path="/reports" element={<PreviousReports />} />
            <Route path="/reports/:id" element={<ReportDetails />} />
            <Route path="/library" element={<Library />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  )
} 