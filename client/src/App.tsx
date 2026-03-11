import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import MyTrips from "@/pages/my-trips";
import TripDetails from "@/pages/trip-details";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import AdminCities from "@/pages/admin/cities";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/login";
import EmailVerification from "./pages/auth/email-verification";
import VerificationPending from "./pages/auth/verification-pending";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      <Route path="/email-verification" component={EmailVerification} />
      
      <Route path="/verification-pending" component={VerificationPending} />
      
      <Route path="/">
        {() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/my-trips">
        {() => (
          <ProtectedRoute>
            <MyTrips />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/trip/:id">
        {(params) => (
          <ProtectedRoute>
            <TripDetails />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/messages">
        {() => (
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/profile">
        {() => (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/admin/cities">
        {() => (
          <ProtectedAdminRoute>
            <AdminCities />
          </ProtectedAdminRoute>
        )}
      </Route>
      
      <Route>
        {() => (
          <ProtectedRoute>
            <NotFound />
          </ProtectedRoute>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
