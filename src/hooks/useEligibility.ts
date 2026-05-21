import { useMemo } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";

export function useEligibility() {
  const { profile } = useAuthContext();
  const schedule = profile?.test_schedule;

  return useMemo(() => {
    const hasProfile = Boolean(profile);
    const profileVerified = profile?.verification_status === "approved";
    const profileRejected = profile?.verification_status === "rejected";
    const eyeTestComplete =
      profile?.eye_test_status === "passed" || profile?.eye_test_status === "uploaded";
    const paymentComplete = profile?.payment_status === "paid";
    const canBookTest = schedule?.can_book_test ?? true;
    const canTakeTestBySchedule = schedule?.can_take_test ?? true;

    return {
      hasProfile,
      profileVerified,
      profileRejected,
      eyeTestComplete,
      paymentComplete,
      canAccessEyeTest: hasProfile && !profileRejected,
      canBook: hasProfile && profileVerified && eyeTestComplete && canBookTest,
      canTakeTest:
        hasProfile && profileVerified && eyeTestComplete && paymentComplete && canTakeTestBySchedule,
      testSchedule: schedule ?? null,
    };
  }, [profile, schedule]);
}
