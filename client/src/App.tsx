import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Success from "./pages/Success";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Book from "./pages/Book";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import CRM from "./pages/admin/CRM";
import LeadDetail from "./pages/admin/LeadDetail";
import Bookings from "./pages/admin/Bookings";
import Availability from "./pages/admin/Availability";
import Analytics from "./pages/admin/Analytics";
import Newsletter from "./pages/admin/Newsletter";
import LeadsDashboard from "./pages/admin/LeadsDashboard";
import Unsubscribe from "./pages/Unsubscribe";
import EmailTemplates from "./pages/admin/EmailTemplates";
import { PageShell } from "./components/PageShell";

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <PageShell>
      <Component />
    </PageShell>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/">
        {() => <PublicRoute component={Home} />}
      </Route>
      <Route path="/book">
        {() => <PublicRoute component={Book} />}
      </Route>
      <Route path="/unsubscribe">
        {() => <PublicRoute component={Unsubscribe} />}
      </Route>
      <Route path="/book/success">
        {() => <PublicRoute component={Success} />}
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        {() => <AdminRoute component={Dashboard} />}
      </Route>
      <Route path="/admin/crm">
        {() => <AdminRoute component={CRM} />}
      </Route>
      <Route path="/admin/leads/:id">
        {() => <AdminRoute component={LeadDetail} />}
      </Route>
      <Route path="/admin/bookings">
        {() => <AdminRoute component={Bookings} />}
      </Route>
      <Route path="/admin/availability">
        {() => <AdminRoute component={Availability} />}
      </Route>
      <Route path="/admin/analytics">
        {() => <AdminRoute component={Analytics} />}
      </Route>
      <Route path="/admin/newsletter">
        {() => <AdminRoute component={Newsletter} />}
      </Route>
      <Route path="/admin/leads">
        {() => <AdminRoute component={LeadsDashboard} />}
      </Route>
      <Route path="/admin/email-templates">
        {() => <AdminRoute component={EmailTemplates} />}
      </Route>

      {/* Fallback */}
      <Route path="/404">
        {() => <PublicRoute component={NotFound} />}
      </Route>
      <Route>
        {() => <PublicRoute component={NotFound} />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

