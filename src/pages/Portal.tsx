import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Eye,
  FileCheck2,
  LogOut,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useEligibility } from "@/hooks/useEligibility";
import { formatDateShort } from "@/lib/formatDate";

type Step = {
  key: string;
  title: string;
  description: string;
  done: boolean;
  href?: string;
  actionLabel?: string;
};

export default function Portal() {
  const navigate = useNavigate();
  const { user, profile, logout, refresh } = useAuthContext();
  const {
    profileVerified,
    profileRejected,
    eyeTestComplete,
    paymentComplete,
    canTakeTest,
    canAccessEyeTest,
    canBook,
    testSchedule,
  } = useEligibility();

  const docsSubmitted = Boolean(profile?.first_name && profile?.surname);

  const steps: Step[] = [
    {
      key: "verify",
      title: "1. Identity & documents",
      description: "Upload ID/passport, face photo, and submit for verifier review.",
      done: profileVerified,
      href: "/profile-verification",
      actionLabel: docsSubmitted ? "Update / review" : "Continue",
    },
    {
      key: "eye",
      title: "2. Vision screening",
      description: "On-screen letters or doctor letter upload.",
      done: eyeTestComplete,
      href: "/eye-test",
      actionLabel: "Open",
    },
    {
      key: "book",
      title: "3. Book & pay",
      description: "Choose a slot and complete PayPal payment.",
      done: paymentComplete,
      href: "/booking",
      actionLabel: "Book",
    },
    {
      key: "test",
      title: "4. Learner theory test",
      description: "70 questions, 60 minutes, 80% pass mark. One attempt every 3 weeks; 13-week wait after a fail.",
      done: Boolean(testSchedule?.last_attempt_passed),
      href: "/instructions",
      actionLabel: "Instructions & test",
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

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

        {docsSubmitted && !profileVerified && profile?.verification_status === "pending" ? (
          <Card className="border-amber-500/30 bg-amber-500/5 p-4 text-sm">
            <strong>Waiting for verifier.</strong> Your documents are in queue. After approval you can finish vision
            screening and booking.
          </Card>
        ) : null}

        {profileVerified ? (
          <Card className="border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="font-semibold mb-1">Profile approved.</p>
            <p className="mb-3">Next step: select your time slot and complete booking, then proceed to the learner test.</p>
            <Button size="sm" onClick={() => navigate("/booking")} disabled={!canBook}>
              Select test time
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {!canBook && testSchedule?.booking_block_reason ? (
              <p className="mt-3 text-muted-foreground">{testSchedule.booking_block_reason}</p>
            ) : null}
          </Card>
        ) : null}

        {testSchedule?.license_collection_from ? (
          <Card className="border-success/30 bg-success/5 p-4 text-sm">
            <p className="font-semibold mb-1">Learner licence collection</p>
            <p>
              You may collect your learner&apos;s licence from{" "}
              {formatDateShort(testSchedule.license_collection_from) ?? "—"}.
            </p>
          </Card>
        ) : null}

        {testSchedule && !testSchedule.can_take_test && testSchedule.test_block_reason ? (
          <Card className="border-amber-500/30 bg-amber-500/5 p-4 text-sm">
            <p className="font-semibold mb-1">Test waiting period</p>
            <p>{testSchedule.test_block_reason}</p>
          </Card>
        ) : null}

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

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            Your learning journey
          </h2>
          <ol className="space-y-4">
            {steps.map((step) => {
              const locked =
                step.key === "eye" && !canAccessEyeTest
                  ? true
                  : step.key === "book" && !canBook
                    ? true
                    : step.key === "test" && !canTakeTest
                      ? true
                      : false;

              return (
                <li
                  key={step.key}
                  className={`flex gap-3 rounded-lg border p-4 ${locked ? "opacity-60" : ""}`}
                >
                  <div className="pt-0.5">
                    {step.done ? (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.href && step.actionLabel ? (
                      <Button
                        size="sm"
                        className="mt-2"
                        disabled={locked}
                        variant={step.done ? "outline" : "default"}
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
      </div>
    </div>
  );
}
