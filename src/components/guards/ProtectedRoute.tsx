import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/components/auth/AuthProvider";

type Props = {
  children: JSX.Element;
  role?: "candidate" | "admin";
};

export default function ProtectedRoute({ children, role }: Props) {
  const { loading, user, profile } = useAuthContext();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && profile?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

