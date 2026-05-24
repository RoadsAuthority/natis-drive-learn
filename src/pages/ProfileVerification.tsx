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
import { useFaceCamera } from "@/hooks/useFaceCamera";

export default function ProfileVerification() {
  const navigate = useNavigate();
  const { refresh } = useAuthContext();
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
      toast.error("Please choose an image file for your face photo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setFaceCapture(result);
        toast.success("Face photo ready.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartCamera = async () => {
    const message = await start();
    if (message) {
      toast.error(message);
    }
  };

  const handleCaptureFace = () => {
    const frame = capture();
    if (!frame) {
      toast.error(ready ? "Could not capture photo. Try again." : "Wait for the camera preview to appear.");
      return;
    }
    setFaceCapture(frame);
    toast.success("Face photo captured.");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.firstName.trim() || !formData.surname.trim() || !formData.idNumber.trim()) {
      toast.error("Fill in first name, surname, and ID number.");
      return;
    }
    if (!idCopy && !passportCopy) {
      toast.error("Upload an ID copy or passport.");
      return;
    }
    if (!faceCapture) {
      toast.error("Capture or upload your face photo before submitting.");
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
      toast.success("Verification submitted. Admin review is required.");
      navigate("/portal");
    } catch (error) {
      toast.error((error as Error).message || "Failed to submit verification.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-6">
      <div className="mx-auto max-w-3xl">
        <Card className="p-6 space-y-6">
          <h1 className="text-2xl font-bold">Profile Verification</h1>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="surname">Surname</Label>
                <Input
                  id="surname"
                  value={formData.surname}
                  onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="licenceCode">Licence Code</Label>
                <Input
                  id="licenceCode"
                  value={formData.licenceCode}
                  onChange={(e) => setFormData({ ...formData, licenceCode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="idCopy">ID Copy</Label>
                <Input id="idCopy" type="file" accept="image/*,.pdf" onChange={(e) => setIdCopy(e.target.files?.[0] ?? null)} />
              </div>
              <div>
                <Label htmlFor="passportCopy">Passport Copy (optional)</Label>
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
                <h2 className="font-semibold">Face photo</h2>
                <div className="flex flex-wrap gap-2">
                  {!capturing ? (
                    <Button type="button" variant="outline" onClick={() => void handleStartCamera()}>
                      <Camera className="mr-2 h-4 w-4" /> Use camera
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleCaptureFace} disabled={!ready}>
                      {ready ? "Capture photo" : "Starting camera…"}
                    </Button>
                  )}
                </div>
              </div>
              {cameraError ? <p className="text-xs text-destructive">{cameraError}</p> : null}
              <p className="text-sm text-muted-foreground">
                Allow camera access when prompted. If it fails, use <strong>Upload face photo</strong> below.
              </p>
              <div>
                <Label htmlFor="facePhoto">Upload face photo (alternative)</Label>
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
                <img src={faceCapture} alt="Face preview" className="max-w-md rounded-md border" />
              ) : null}
            </Card>

            <Button type="submit" className="w-full" disabled={submitting}>
              <Upload className="mr-2 h-4 w-4" />
              {submitting ? "Submitting..." : "Submit for Admin Verification"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
