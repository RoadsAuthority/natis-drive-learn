import { useMemo } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";

export function useEligibility() {
  const { profile } = useAuthContext();
  const schedule = profile?.test_schedule;

  return useMemo(() => {
    const hasProfile = Boolean(profile);
    const profileVerified = profile?.verification_status === "approved";
    const profileRejected = profile?.verification_status === "rejected";
    const docsSubmitted =
      Boolean(profile?.first_name && profile?.surname) &&
      profile?.verification_status === "pending";
    const docsPendingReview = docsSubmitted && !profileVerified;
    const eyeTestComplete =
      profile?.eye_test_status === "passed" || profile?.eye_test_status === "uploaded";
    const paymentComplete = profile?.payment_status === "paid";
    const testPassed = Boolean(schedule?.last_attempt_passed);
    const testAttempted = Boolean(schedule?.last_attempt_at);
    const canBookTest = schedule?.can_book_test ?? true;
    const canTakeTestBySchedule = schedule?.can_take_test ?? true;

    const journeyComplete =
      profileVerified && eyeTestComplete && paymentComplete && testPassed;

    const completedStepCount = [
      profileVerified,
      eyeTestComplete,
      paymentComplete,
      testPassed,
    ].filter(Boolean).length;

    return {
      hasProfile,
      profileVerified,
      profileRejected,
      docsSubmitted,
      docsPendingReview,
      eyeTestComplete,
      paymentComplete,
      testPassed,
      testAttempted,
      journeyComplete,
      completedStepCount,
      totalSteps: 4,
      canAccessEyeTest: hasProfile && profileVerified && !profileRejected,
      canBook: hasProfile && profileVerified && eyeTestComplete && canBookTest,
      canTakeTest:
        hasProfile && profileVerified && eyeTestComplete && paymentComplete && canTakeTestBySchedule,
      testSchedule: schedule ?? null,
    };
  }, [profile, schedule]);
}
