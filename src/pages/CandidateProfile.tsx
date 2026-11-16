import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Award, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useEligibility } from "@/hooks/useEligibility";
import { formatDateShort } from "@/lib/formatDate";
import { useLanguage } from "@/i18n/LanguageProvider";

function statusLabel(status: string, t: (path: string) => string) {
  const key = `status.${status}`;
  const translated = t(key);
  return translated === key ? status.replace(/_/g, " ") : translated;
}

export default function CandidateProfile() {
  const navigate = useNavigate();
  const { user, profile, refresh } = useAuthContext();
  const { locale, t } = useLanguage();
  const { testPassed, testAttempted, profileVerified, eyeTestComplete, paymentComplete, testSchedule } =
    useEligibility();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const fullName = [profile?.first_name, profile?.surname].filter(Boolean).join(" ") || user?.email || "—";

  return (
    <div className="w-full">
      <div className="mx-auto max-w-5xl space-y-6">

        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{t("profile.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("profile.subtitle")}</p>
            </div>
            {testPassed ? (
              <Badge className="bg-success text-success-foreground">{t("profile.passed")}</Badge>
            ) : testAttempted ? (
              <Badge variant="secondary">{t("profile.attempted")}</Badge>
            ) : (
              <Badge variant="outline">{t("profile.inProgress")}</Badge>
            )}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-muted-foreground">{t("profile.fullName")}</dt>
              <dd className="font-medium">{fullName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("profile.email")}</dt>
              <dd className="font-medium">{profile?.email ?? user?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("profile.idNumber")}</dt>
              <dd className="font-medium">{profile?.id_number ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("profile.licenceCode")}</dt>
              <dd className="font-medium">{profile?.licence_code ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("profile.documents")}</dt>
              <dd className="font-medium capitalize">{statusLabel(profile?.verification_status ?? "pending", t)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("profile.vision")}</dt>
              <dd className="font-medium capitalize">{statusLabel(profile?.eye_test_status ?? "pending", t)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("profile.payment")}</dt>
              <dd className="font-medium capitalize">{statusLabel(profile?.payment_status ?? "pending", t)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("profile.theory")}</dt>
              <dd className="font-medium">
                {testPassed ? t("portal.passed") : testAttempted ? t("profile.notPassed") : t("profile.notTaken")}
              </dd>
            </div>
          </dl>

          {testSchedule?.last_attempt_score != null && testSchedule.last_attempt_total != null ? (
            <Card className="p-4 bg-muted/50 text-sm">
              <p className="font-medium flex items-center gap-2">
                <FileCheck2 className="h-4 w-4" />
                {t("profile.latest")}
              </p>
              <p className="mt-1">
                {testSchedule.last_attempt_score}/{testSchedule.last_attempt_total}
                {testSchedule.last_attempt_percentage != null
                  ? ` (${Number(testSchedule.last_attempt_percentage).toFixed(1)}%)`
                  : ""}
                {testSchedule.last_attempt_at
                  ? ` · ${formatDateShort(testSchedule.last_attempt_at, locale) ?? ""}`
                  : ""}
              </p>
            </Card>
          ) : null}

          {testSchedule?.license_collection_from ? (
            <p className="text-sm rounded-md border border-success/20 bg-success/5 p-3">
              {t("profile.collectFrom", {
                date: formatDateShort(testSchedule.license_collection_from, locale) ?? "—",
              })}
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
                {t("profile.viewCertificate")}
              </Button>
            ) : null}
            {!profileVerified ? (
              <Button variant="outline" onClick={() => navigate("/profile-verification")}>
                {t("profile.completeVerification")}
              </Button>
            ) : null}
            {profileVerified && !eyeTestComplete ? (
              <Button variant="outline" onClick={() => navigate("/eye-test")}>
                {t("profile.visionAction")}
              </Button>
            ) : null}
            {profileVerified && eyeTestComplete && !paymentComplete ? (
              <Button variant="outline" onClick={() => navigate("/booking")}>
                {t("profile.bookPay")}
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => navigate("/portal")}>
              {t("profile.journey")}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
