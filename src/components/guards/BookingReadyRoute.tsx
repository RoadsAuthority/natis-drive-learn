import { Navigate } from "react-router-dom";
import { useEligibility } from "@/hooks/useEligibility";

type Props = {
  children: JSX.Element;
};

export default function BookingReadyRoute({ children }: Props) {
  const { canBook } = useEligibility();

  if (!canBook) {
    return <Navigate to="/portal" replace />;
  }

  return children;
}
