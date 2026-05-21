import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/components/auth/AuthProvider";

type Props = {
  children: JSX.Element;
};

export default function NonAdminRoute({ children }: Props) {
  const { loading, profile } = useAuthContext();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (profile?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

