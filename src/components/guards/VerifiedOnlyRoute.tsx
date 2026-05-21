import { Navigate } from "react-router-dom";
import { useEligibility } from "@/hooks/useEligibility";

type Props = {
  children: JSX.Element;
};

export default function VerifiedOnlyRoute({ children }: Props) {
  const { canTakeTest } = useEligibility();

  if (!canTakeTest) {
    return <Navigate to="/portal" replace />;
  }

  return children;
}

