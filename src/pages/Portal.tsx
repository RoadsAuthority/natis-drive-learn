import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  FileCheck2,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useEligibility } from "@/hooks/useEligibility";
import { formatDateShort } from "@/lib/formatDate";

type StepStatus = "done" | "in_review" | "action_needed" | "locked";

type Step = {
  key: string;
  title: string;
  description: string;
  status: StepStatus;
  statusLabel: string;
  href?: string;
  actionLabel?: string;
};

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done") {
    return <CheckCircle2 className="h-6 w-6 text-success" />;
  }
  if (status === "in_review") {
    return <Clock className="h-6 w-6 text-amber-500" />;
  }
  return <Circle className="h-6 w-6 text-muted-foreground" />;
}

function statusBadgeVariant(status: StepStatus): "default" | "secondary" | "outline" {
  if (status === "done") return "default";
  if (status === "in_review") return "secondary";
  return "outline";
}

export default function Portal() {
  const navigate = useNavigate();
  const { user, profile, logout, refresh } = useAuthContext();
  const {
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
    totalSteps,
    canTakeTest,
    canAccessEyeTest,
    canBook,
    testSchedule,
  } = useEligibility();

  const verifyStatus: StepStatus = profileVerified
    ? "done"
    : docsPendingReview
      ? "in_review"
      : profileRejected
        ? "action_needed"
        : "action_needed";

  const eyeStatus: StepStatus = eyeTestComplete
    ? "done"
    : !canAccessEyeTest
      ? "locked"
      : "action_needed";

  const bookStatus: StepStatus = paymentComplete
    ? "done"
    : !canBook
      ? "locked"
      : "action_needed";

  const testStatus: StepStatus = testPassed
    ? "done"
    : testAttempted
      ? "action_needed"
      : !canTakeTest
        ? "locked"
        : "action_needed";

  const steps: Step[] = [
    {
      key: "verify",
      title: "1. Identity & documents",
      description: "Upload ID/passport, face photo, and submit for verifier review.",
      status: verifyStatus,
      statusLabel: profileVerified
        ? "Verified"
        : docsPendingReview
          ? "Awaiting verifier"
          : profileRejected
            ? "Not approved"
            : "Not started",
      href: "/profile-verification",
      actionLabel: docsSubmitted || profileVerified ? "View / update" : "Continue",
    },
    {
      key: "eye",
      title: "2. Vision screening",
      description: "On-screen letters or doctor letter upload.",
      status: eyeStatus,
      statusLabel: eyeTestComplete ? "Complete" : canAccessEyeTest ? "Required" : "Locked",
      href: "/eye-test",
      actionLabel: eyeTestComplete ? "View" : "Open",
    },
    {
      key: "book",
      title: "3. Book & pay",
      description: "Choose a slot and complete payment.",
      status: bookStatus,
      statusLabel: paymentComplete ? "Booked & paid" : canBook ? "Required" : "Locked",
      href: "/booking",
      actionLabel: paymentComplete ? "View booking" : "Book",
    },
    {
      key: "test",
      title: "4. Learner theory test",
      description: "70 questions, 60 minutes, 80% pass mark.",
      status: testStatus,
      statusLabel: testPassed
        ? "Passed"
        : testAttempted
          ? "Retake when eligible"
          : canTakeTest
            ? "Ready"
            : "Locked",
      href: testPassed ? "/results" : "/instructions",
      actionLabel: testPassed ? "View result" : testAttempted ? "View info" : "Start",
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const progressPercent = (completedStepCount / totalSteps) * 100;

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Learner Licence Portal</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Refresh status
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        {profileRejected ? (
          <Card className="border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
            <p className="font-semibold mb-1">Application not approved.</p>
            <p>{profile?.rejection_reason ?? "No reason was supplied by verifier."}</p>
            <p className="mt-2">Contact your testing centre if you need support.</p>
          </Card>
        ) : null}

        {journeyComplete ? (
          <Card className="border-success/30 bg-success/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-success/10 p-2">
                <User className="h-6 w-6 text-success" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Your learner profile</h2>
                <p className="text-sm text-muted-foreground">All steps complete — you passed the theory test.</p>
              </div>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Full name</dt>
                <dd className="font-medium">
                  {[profile?.first_name, profile?.surname].filter(Boolean).join(" ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">ID number</dt>
                <dd className="font-medium">{profile?.id_number ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Licence code</dt>
                <dd className="font-medium">{profile?.licence_code ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{profile?.email ?? user?.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Documents</dt>
                <dd className="font-medium text-success">Verified</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Vision screening</dt>
                <dd className="font-medium capitalize">{profile?.eye_test_status ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Payment</dt>
                <dd className="font-medium capitalize">{profile?.payment_status ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Theory test</dt>
                <dd className="font-medium text-success">Passed</dd>
              </div>
            </dl>
            {testSchedule?.license_collection_from ? (
              <p className="text-sm rounded-md border border-success/20 bg-background/60 p-3">
                Collect your learner&apos;s licence from{" "}
                <strong>{formatDateShort(testSchedule.license_collection_from) ?? "—"}</strong>.
              </p>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => navigate("/results")}>
              View test result
            </Button>
          </Card>
        ) : (
          <>
            {!profileRejected ? (
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">Journey progress</span>
                  <span className="text-muted-foreground">
                    {completedStepCount} of {totalSteps} complete
                  </span>
                </div>
                <Progress value={progressPercent} />
              </Card>
            ) : null}

            {docsPendingReview ? (
              <Card className="border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                <strong>Awaiting verifier.</strong> Your documents are in queue. Step 1 will be marked complete once
                approved.
              </Card>
            ) : null}

            {profileVerified && !eyeTestComplete ? (
              <Card className="border-primary/30 bg-primary/5 p-4 text-sm">
                <p className="font-semibold mb-1">Documents verified.</p>
                <p className="mb-3">Next step: complete vision screening.</p>
                <Button size="sm" onClick={() => navigate("/eye-test")}>
                  Continue to vision screening
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            ) : null}

            {testSchedule && !testSchedule.can_take_test && testSchedule.test_block_reason ? (
              <Card className="border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                <p className="font-semibold mb-1">Test waiting period</p>
                <p>{testSchedule.test_block_reason}</p>
              </Card>
            ) : null}

            <Card className="p-6 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-primary" />
                Your learning journey
              </h2>
              <ol className="space-y-4">
                {steps.map((step) => {
                  const locked = step.status === "locked";

                  return (
                    <li
                      key={step.key}
                      className={`flex gap-3 rounded-lg border p-4 ${
                        step.status === "done"
                          ? "border-success/30 bg-success/5"
                          : step.status === "in_review"
                            ? "border-amber-500/30 bg-amber-500/5"
                            : locked
                              ? "opacity-60"
                              : ""
                      }`}
                    >
                      <div className="pt-0.5">
                        <StepIcon status={step.status} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{step.title}</p>
                          <Badge variant={statusBadgeVariant(step.status)}>{step.statusLabel}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        {step.href && step.actionLabel ? (
                          <Button
                            size="sm"
                            className="mt-2"
                            disabled={locked}
                            variant={step.status === "done" ? "outline" : "default"}
                            onClick={() => {
                              if (!locked) navigate(step.href!);
                            }}
                          >
                            {step.key === "eye" ? <Eye className="mr-2 h-4 w-4" /> : null}
                            {step.key === "book" ? <Calendar className="mr-2 h-4 w-4" /> : null}
                            {step.actionLabel}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>
          </>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" className="justify-start h-auto py-4" onClick={() => navigate("/study")}>
            <BookOpen className="mr-3 h-5 w-5 shrink-0" />
            <span className="text-left text-sm">Official PDFs (learner book & practice papers)</span>
          </Button>
          {profile?.role === "admin" ? (
            <Button variant="outline" className="justify-start h-auto py-4" onClick={() => navigate("/admin")}>
              <Shield className="mr-3 h-5 w-5 shrink-0" />
              <span className="text-left text-sm">Verifier / admin console</span>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
