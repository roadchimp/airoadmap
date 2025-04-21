import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import NewAssessment from "@/pages/NewAssessment";
import PreviousReports from "@/pages/PreviousReports";
import ReportDetails from "@/pages/ReportDetails";
import Library from "@/pages/Library";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/assessment/new" component={NewAssessment} />
      <Route path="/assessment/:step" component={NewAssessment} />
      <Route path="/reports" component={PreviousReports} />
      <Route path="/reports/:id" component={ReportDetails} />
      <Route path="/library" component={Library} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppLayout>
          <Router />
        </AppLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
