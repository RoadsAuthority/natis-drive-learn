import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitProfileVerification } from "@/lib/natisApi";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useFaceCamera, type CameraErrorCode } from "@/hooks/useFaceCamera";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function ProfileVerification() {
  const navigate = useNavigate();
  const { refresh } = useAuthContext();
  const { t } = useLanguage();
  const { videoRef, capturing, ready, error: cameraError, start, capture } = useFaceCamera();
  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    idNumber: "",
    licenceCode: "B",
  });
  const [idCopy, setIdCopy] = useState<File | null>(null);
  const [passportCopy, setPassportCopy] = useState<File | null>(null);
  const [faceCapture, setFaceCapture] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const onFacePhotoFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("verify.imageOnly"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setFaceCapture(result);
        toast.success(t("verify.faceReady"));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartCamera = async () => {
    const message = await start();
    if (message) {
      toast.error(t(`camera.${message}`));
    }
  };

  const handleCaptureFace = () => {
    const frame = capture();
    if (!frame) {
      toast.error(ready ? t("verify.captureFailed") : t("verify.waitPreview"));
      return;
    }
    setFaceCapture(frame);
    toast.success(t("verify.captured"));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.firstName.trim() || !formData.surname.trim() || !formData.idNumber.trim()) {
      toast.error(t("verify.fillRequired"));
      return;
    }
    if (!/^\d+$/.test(formData.idNumber.trim())) {
      toast.error(t("verify.idDigitsOnly"));
      return;
    }
    if (!idCopy && !passportCopy) {
      toast.error(t("verify.needId"));
      return;
    }
    if (!faceCapture) {
      toast.error(t("verify.needFace"));
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("firstName", formData.firstName.trim());
      payload.append("surname", formData.surname.trim());
      payload.append("idNumber", formData.idNumber.trim());
      payload.append("licenceCode", formData.licenceCode.trim());
      if (idCopy) payload.append("idCopy", idCopy);
      if (passportCopy) payload.append("passportCopy", passportCopy);
      payload.append("faceCaptureBase64", faceCapture);
      await submitProfileVerification(payload);
      localStorage.setItem("profile", JSON.stringify(formData));
      await refresh();
      toast.success(t("verify.submitted"));
      navigate("/portal");
    } catch (error) {
      toast.error((error as Error).message || t("verify.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto max-w-5xl">
        <Card className="p-6 space-y-6">
          <h1 className="text-2xl font-bold">{t("verify.title")}</h1>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">{t("verify.firstName")}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="surname">{t("verify.surname")}</Label>
                <Input
                  id="surname"
                  value={formData.surname}
                  onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="idNumber">{t("verify.idNumber")}</Label>
                <Input
                  id="idNumber"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{1,32}"
                  maxLength={32}
                  autoComplete="off"
                  required
                  value={formData.idNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,32}$/.test(value)) {
                      setFormData({ ...formData, idNumber: value });
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="licenceCode">{t("verify.licenceCode")}</Label>
                <Input
                  id="licenceCode"
                  value={formData.licenceCode}
                  onChange={(e) => setFormData({ ...formData, licenceCode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="idCopy">{t("verify.idCopy")}</Label>
                <Input id="idCopy" type="file" accept="image/*,.pdf" onChange={(e) => setIdCopy(e.target.files?.[0] ?? null)} />
              </div>
              <div>
                <Label htmlFor="passportCopy">{t("verify.passport")}</Label>
                <Input
                  id="passportCopy"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setPassportCopy(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <Card className="p-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-semibold">{t("verify.face")}</h2>
                <div className="flex flex-wrap gap-2">
                  {!capturing ? (
                    <Button type="button" variant="outline" onClick={() => void handleStartCamera()}>
                      <Camera className="mr-2 h-4 w-4" /> {t("verify.useCamera")}
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleCaptureFace} disabled={!ready}>
                      {ready ? t("verify.capture") : t("verify.startingCamera")}
                    </Button>
                  )}
                </div>
              </div>
              {cameraError ? <p className="text-xs text-destructive">{t(`camera.${cameraError as CameraErrorCode}`)}</p> : null}
              <p className="text-sm text-muted-foreground">{t("verify.cameraHelp")}</p>
              <div>
                <Label htmlFor="facePhoto">{t("verify.uploadFace")}</Label>
                <Input
                  id="facePhoto"
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="mt-1"
                  onChange={(e) => onFacePhotoFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full max-w-md min-h-[240px] rounded-md border bg-muted/30 object-cover ${
                  capturing ? "block" : "hidden"
                }`}
              />
              {faceCapture ? (
                <img src={faceCapture} alt={t("verify.faceAlt")} className="max-w-md rounded-md border" />
              ) : null}
            </Card>

            <Button type="submit" className="w-full" disabled={submitting}>
              <Upload className="mr-2 h-4 w-4" />
              {submitting ? t("verify.submitting") : t("verify.submit")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
