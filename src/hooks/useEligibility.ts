import { useMemo } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";

export function useEligibility() {
  const { profile } = useAuthContext();

  return useMemo(() => {
    const hasProfile = Boolean(profile);
    const profileVerified = profile?.verification_status === "approved";
    const eyeTestComplete =
      profile?.eye_test_status === "passed" || profile?.eye_test_status === "uploaded";
    const paymentComplete = profile?.payment_status === "paid";

    return {
      hasProfile,
      profileVerified,
      eyeTestComplete,
      paymentComplete,
      canBook: hasProfile && profileVerified,
      canTakeTest: hasProfile && profileVerified && eyeTestComplete && paymentComplete,
    };
  }, [profile]);
}

