import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Award, FileCheck2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useEligibility } from "@/hooks/useEligibility";
import { formatDateShort } from "@/lib/formatDate";

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export default function CandidateProfile() {
  const navigate = useNavigate();
  const { user, profile, logout, refresh } = useAuthContext();
  const { testPassed, testAttempted, profileVerified, eyeTestComplete, paymentComplete, testSchedule } =
    useEligibility();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const fullName = [profile?.first_name, profile?.surname].filter(Boolean).join(" ") || user?.email || "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/portal")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Portal
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">My profile</h1>
              <p className="text-sm text-muted-foreground">Your learner licence application details</p>
            </div>
            {testPassed ? (
              <Badge className="bg-success text-success-foreground">Theory test passed</Badge>
            ) : testAttempted ? (
              <Badge variant="secondary">Test attempted</Badge>
            ) : (
              <Badge variant="outline">In progress</Badge>
            )}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Full name</dt>
              <dd className="font-medium">{fullName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{profile?.email ?? user?.email ?? "—"}</dd>
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
              <dt className="text-muted-foreground">Documents</dt>
              <dd className="font-medium capitalize">{statusLabel(profile?.verification_status ?? "pending")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Vision screening</dt>
              <dd className="font-medium capitalize">{statusLabel(profile?.eye_test_status ?? "pending")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="font-medium capitalize">{statusLabel(profile?.payment_status ?? "pending")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Theory test</dt>
              <dd className="font-medium">
                {testPassed ? "Passed" : testAttempted ? "Not passed" : "Not taken"}
              </dd>
            </div>
          </dl>

          {testSchedule?.last_attempt_score != null && testSchedule.last_attempt_total != null ? (
            <Card className="p-4 bg-muted/50 text-sm">
              <p className="font-medium flex items-center gap-2">
                <FileCheck2 className="h-4 w-4" />
                Latest test result
              </p>
              <p className="mt-1">
                {testSchedule.last_attempt_score}/{testSchedule.last_attempt_total}
                {testSchedule.last_attempt_percentage != null
                  ? ` (${Number(testSchedule.last_attempt_percentage).toFixed(1)}%)`
                  : ""}
                {testSchedule.last_attempt_at
                  ? ` · ${formatDateShort(testSchedule.last_attempt_at) ?? ""}`
                  : ""}
              </p>
            </Card>
          ) : null}

          {testSchedule?.license_collection_from ? (
            <p className="text-sm rounded-md border border-success/20 bg-success/5 p-3">
              Collect your learner&apos;s licence from{" "}
              <strong>{formatDateShort(testSchedule.license_collection_from) ?? "—"}</strong>.
            </p>
          ) : null}

          {testSchedule?.test_block_reason && !testPassed ? (
            <p className="text-sm rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
              {testSchedule.test_block_reason}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            {testPassed ? (
              <Button onClick={() => navigate("/certificate")}>
                <Award className="mr-2 h-4 w-4" />
                View certificate
              </Button>
            ) : null}
            {!profileVerified ? (
              <Button variant="outline" onClick={() => navigate("/profile-verification")}>
                Complete verification
              </Button>
            ) : null}
            {profileVerified && !eyeTestComplete ? (
              <Button variant="outline" onClick={() => navigate("/eye-test")}>
                Vision screening
              </Button>
            ) : null}
            {profileVerified && eyeTestComplete && !paymentComplete ? (
              <Button variant="outline" onClick={() => navigate("/booking")}>
                Book & pay
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => navigate("/portal")}>
              Learning journey
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
