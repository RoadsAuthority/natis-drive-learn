import { Navigate } from "react-router-dom";
import { useEligibility } from "@/hooks/useEligibility";

type Props = {
  children: JSX.Element;
};

export default function NotRejectedRoute({ children }: Props) {
  const { profileRejected } = useEligibility();

  if (profileRejected) {
    return <Navigate to="/portal" replace />;
  }

  return children;
}
