import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LanguageSelection from "./pages/LanguageSelection";
import Login from "./pages/Login";
import ProfileVerification from "./pages/ProfileVerification";
import TestInstructions from "./pages/TestInstructions";
import Test from "./pages/Test";
import Results from "./pages/Results";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import EyeTest from "./pages/EyeTest";
import Booking from "./pages/Booking";
import StudyMaterials from "./pages/StudyMaterials";
import ProtectedRoute from "./components/guards/ProtectedRoute";
import VerifiedOnlyRoute from "./components/guards/VerifiedOnlyRoute";
import NotRejectedRoute from "./components/guards/NotRejectedRoute";
import BookingReadyRoute from "./components/guards/BookingReadyRoute";
import NonAdminRoute from "./components/guards/NonAdminRoute";
import { AuthProvider } from "./components/auth/AuthProvider";
import Portal from "./pages/Portal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LanguageSelection />} />
            <Route
              path="/study"
              element={
                <NonAdminRoute>
                  <StudyMaterials />
                </NonAdminRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route
              path="/portal"
              element={
                <ProtectedRoute role="candidate">
                  <Portal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile-verification"
              element={
                <ProtectedRoute role="candidate">
                  <ProfileVerification />
                </ProtectedRoute>
              }
            />
            <Route path="/personal-info" element={<ProfileVerification />} />
            <Route
              path="/eye-test"
              element={
                <ProtectedRoute role="candidate">
                  <NotRejectedRoute>
                    <EyeTest />
                  </NotRejectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking"
              element={
                <ProtectedRoute role="candidate">
                  <BookingReadyRoute>
                    <Booking />
                  </BookingReadyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructions"
              element={
                <ProtectedRoute role="candidate">
                  <VerifiedOnlyRoute>
                    <TestInstructions />
                  </VerifiedOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/test"
              element={
                <ProtectedRoute role="candidate">
                  <VerifiedOnlyRoute>
                    <Test />
                  </VerifiedOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/results"
              element={
                <ProtectedRoute role="candidate">
                  <Results />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
