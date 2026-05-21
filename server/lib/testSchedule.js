const RETAKE_MIN_DAYS = 21;
const FAIL_REBOOK_DAYS = 91;
const LICENSE_COLLECTION_DAYS = 7;
const PROCTORING_REVIEW_THRESHOLD = 30;

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function maxDate(...dates) {
  const valid = dates.filter(Boolean).map((value) => new Date(value));
  if (!valid.length) return null;
  return new Date(Math.max(...valid.map((value) => value.getTime())));
}

function formatDateLabel(date) {
  if (!date) return null;
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function buildScheduleState(profile, lastAttempt) {
  const now = new Date();
  const passedAttempt = lastAttempt?.passed ? lastAttempt : null;
  const failedAttempt = lastAttempt && !lastAttempt.passed ? lastAttempt : null;
  const lastAttemptAt = lastAttempt?.created_at ? new Date(lastAttempt.created_at) : null;
  const nextTestEligibleAt = maxDate(
    profile?.next_test_eligible_at,
    lastAttemptAt
      ? addDays(lastAttemptAt, failedAttempt ? FAIL_REBOOK_DAYS : RETAKE_MIN_DAYS)
      : null
  );
  const nextBookingEligibleAt = maxDate(
    profile?.next_booking_eligible_at,
    failedAttempt?.created_at ? addDays(failedAttempt.created_at, FAIL_REBOOK_DAYS) : null
  );
  const licenseCollectionFrom = maxDate(
    profile?.license_collection_from,
    passedAttempt?.created_at ? addDays(passedAttempt.created_at, LICENSE_COLLECTION_DAYS) : null
  );

  let canTakeTest = true;
  let canBookTest = true;
  let testBlockReason = null;
  let bookingBlockReason = null;

  if (passedAttempt) {
    canTakeTest = false;
    canBookTest = false;
    testBlockReason = "You already passed the learner theory test.";
    bookingBlockReason = testBlockReason;
  } else {
    if (nextTestEligibleAt && nextTestEligibleAt > now) {
      canTakeTest = false;
      testBlockReason = `You can take the test again from ${formatDateLabel(nextTestEligibleAt)}.`;
    }
    if (nextBookingEligibleAt && nextBookingEligibleAt > now) {
      canBookTest = false;
      bookingBlockReason = `You can register for another test from ${formatDateLabel(nextBookingEligibleAt)}.`;
    }
  }

  return {
    canTakeTest,
    canBookTest,
    testBlockReason,
    bookingBlockReason,
    nextTestEligibleAt,
    nextBookingEligibleAt,
    licenseCollectionFrom,
    lastAttemptAt,
    lastAttemptPassed: Boolean(passedAttempt),
    lastAttemptFailed: Boolean(failedAttempt),
  };
}

function deriveReviewFlag(summary, suspicionScore) {
  const tabSwitches = Number(summary?.tabSwitches ?? 0);
  const faceMissingEvents = Number(summary?.faceMissingEvents ?? 0);
  return suspicionScore >= PROCTORING_REVIEW_THRESHOLD || tabSwitches >= 3 || faceMissingEvents >= 5;
}

export {
  RETAKE_MIN_DAYS,
  FAIL_REBOOK_DAYS,
  LICENSE_COLLECTION_DAYS,
  PROCTORING_REVIEW_THRESHOLD,
  addDays,
  buildScheduleState,
  deriveReviewFlag,
};
