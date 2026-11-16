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
import { LanguageProvider } from "./i18n/LanguageProvider";
import Portal from "./pages/Portal";
import CandidateProfile from "./pages/CandidateProfile";
import Certificate from "./pages/Certificate";
import LearnerWorkspace from "./components/layout/LearnerWorkspace";
import { useAuthContext } from "./components/auth/AuthProvider";

const queryClient = new QueryClient();

function StudyRoute() {
  const { user, profile } = useAuthContext();
  const page = user && profile?.role === "candidate" ? (
    <LearnerWorkspace><StudyMaterials embedded /></LearnerWorkspace>
  ) : (
    <StudyMaterials />
  );

  return <NonAdminRoute>{page}</NonAdminRoute>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LanguageSelection />} />
            <Route
              path="/study"
              element={<StudyRoute />}
            />
            <Route path="/login" element={<Login />} />
            <Route
              path="/portal"
              element={
                <ProtectedRoute role="candidate">
                    <LearnerWorkspace><Portal /></LearnerWorkspace>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-profile"
              element={
                <ProtectedRoute role="candidate">
                  <LearnerWorkspace><CandidateProfile /></LearnerWorkspace>
                </ProtectedRoute>
              }
            />
            <Route
              path="/certificate"
              element={
                <ProtectedRoute role="candidate">
                  <LearnerWorkspace><Certificate /></LearnerWorkspace>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile-verification"
              element={
                <ProtectedRoute role="candidate">
                  <LearnerWorkspace><ProfileVerification /></LearnerWorkspace>
                </ProtectedRoute>
              }
            />
            <Route path="/personal-info" element={<ProfileVerification />} />
            <Route
              path="/eye-test"
              element={
                <ProtectedRoute role="candidate">
                  <NotRejectedRoute>
                    <LearnerWorkspace><EyeTest /></LearnerWorkspace>
                  </NotRejectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking"
              element={
                <ProtectedRoute role="candidate">
                  <BookingReadyRoute>
                    <LearnerWorkspace><Booking /></LearnerWorkspace>
                  </BookingReadyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructions"
              element={
                <ProtectedRoute role="candidate">
                  <VerifiedOnlyRoute>
                    <LearnerWorkspace><TestInstructions /></LearnerWorkspace>
                  </VerifiedOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/test"
              element={
                <ProtectedRoute role="candidate">
                  <VerifiedOnlyRoute>
                    <LearnerWorkspace><Test /></LearnerWorkspace>
                  </VerifiedOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/results"
              element={
                <ProtectedRoute role="candidate">
                  <LearnerWorkspace><Results /></LearnerWorkspace>
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
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
