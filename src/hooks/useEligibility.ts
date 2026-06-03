import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { buildLiveSchedule, hasPendingWaitPeriod } from "@/lib/testSchedule";

export function useEligibility() {
  const { profile } = useAuthContext();
  const schedule = profile?.test_schedule;
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!hasPendingWaitPeriod(schedule ?? null)) return;
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [schedule]);

  const liveSchedule = useMemo(() => buildLiveSchedule(schedule ?? null, nowMs), [schedule, nowMs]);

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
    const testPassed = Boolean(liveSchedule?.last_attempt_passed);
    const testAttempted = Boolean(liveSchedule?.last_attempt_at);
    const canBookTest = liveSchedule?.can_book_test ?? true;
    const canTakeTestBySchedule = liveSchedule?.can_take_test ?? true;

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
      testSchedule: liveSchedule,
    };
  }, [profile, liveSchedule]);
}
