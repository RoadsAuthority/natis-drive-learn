import { formatDateShort, formatDateTime } from "@/lib/formatDate";
import type { UserProfile } from "@/lib/auth";

export type TestSchedule = NonNullable<UserProfile["test_schedule"]>;

function formatWaitLabel(date: Date) {
  const now = Date.now();
  const diffMs = date.getTime() - now;
  if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000) {
    return formatDateTime(date);
  }
  return formatDateShort(date) ?? formatDateTime(date);
}

/** Re-evaluate wait periods using the user's local clock so times stay accurate. */
export function buildLiveSchedule(schedule: TestSchedule | null, nowMs = Date.now()): TestSchedule | null {
  if (!schedule) return null;

  if (schedule.last_attempt_passed) {
    return {
      ...schedule,
      can_take_test: false,
      can_book_test: false,
      test_block_reason: "You already passed the learner theory test.",
      booking_block_reason: "You already passed the learner theory test.",
    };
  }

  const nextTestAt = schedule.next_test_eligible_at ? new Date(schedule.next_test_eligible_at).getTime() : null;
  const nextBookAt = schedule.next_booking_eligible_at ? new Date(schedule.next_booking_eligible_at).getTime() : null;

  let canTakeTest = true;
  let canBookTest = true;
  let testBlockReason: string | null = null;
  let bookingBlockReason: string | null = null;

  if (nextTestAt && nextTestAt > nowMs) {
    canTakeTest = false;
    testBlockReason = `You can take the test again from ${formatWaitLabel(new Date(nextTestAt))}.`;
  }
  if (nextBookAt && nextBookAt > nowMs) {
    canBookTest = false;
    bookingBlockReason = `You can register for another test from ${formatWaitLabel(new Date(nextBookAt))}.`;
  }

  return {
    ...schedule,
    can_take_test: canTakeTest,
    can_book_test: canBookTest,
    test_block_reason: testBlockReason,
    booking_block_reason: bookingBlockReason,
  };
}

export function hasPendingWaitPeriod(schedule: TestSchedule | null) {
  if (!schedule) return false;
  const nowMs = Date.now();
  const nextTestAt = schedule.next_test_eligible_at ? new Date(schedule.next_test_eligible_at).getTime() : null;
  const nextBookAt = schedule.next_booking_eligible_at ? new Date(schedule.next_booking_eligible_at).getTime() : null;
  return Boolean((nextTestAt && nextTestAt > nowMs) || (nextBookAt && nextBookAt > nowMs));
}
