import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitProfileVerification } from "@/lib/natisApi";
import { useAuthContext } from "@/components/auth/AuthProvider";

export default function ProfileVerification() {
  const navigate = useNavigate();
  const { refresh } = useAuthContext();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    idNumber: "",
    licenceCode: "B",
  });
  const [idCopy, setIdCopy] = useState<File | null>(null);
  const [passportCopy, setPassportCopy] = useState<File | null>(null);
  const [faceCapture, setFaceCapture] = useState<string>("");
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cameraIssue, setCameraIssue] = useState<string | null>(null);

  const isSecureCameraContext =
    typeof window !== "undefined" &&
    (window.isSecureContext || /^localhost$|^127\.0\.0\.1$/i.test(window.location.hostname));

  const cameraErrorMessage = (err: unknown) => {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return "Camera is blocked. Click the lock or site icon in your browser’s address bar, allow Camera for this site, then try again—or upload a face photo below.";
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return "No camera was found. Connect a camera or upload a face photo below.";
    }
    if (name === "NotReadableError" || name === "TrackStartError") {
      return "The camera is in use by another app. Close other apps using the camera or upload a photo below.";
    }
    if (typeof window !== "undefined" && !window.isSecureContext && !/^localhost$|^127\.0\.0\.1$/i.test(window.location.hostname)) {
      return "The camera only works on HTTPS (or localhost). Open the site over HTTPS, or upload a face photo below.";
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      return "This browser does not support camera access here. Upload a face photo below.";
    }
    return "Could not use the camera. Upload a face photo below instead.";
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const message = cameraErrorMessage(null);
      setCameraIssue(message);
      toast.error(message);
      return;
    }
    if (!isSecureCameraContext) {
      const message = cameraErrorMessage(new DOMException("Insecure context", "NotAllowedError"));
      setCameraIssue(message);
      toast.error(message);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCapturing(true);
        setCameraIssue(null);
      }
    } catch (err) {
      const message = cameraErrorMessage(err);
      setCameraIssue(message);
      toast.error(message);
    }
  };

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
        const stream = videoRef.current?.srcObject as MediaStream | null;
        stream?.getTracks().forEach((track) => track.stop());
        setCapturing(false);
        if (videoRef.current) videoRef.current.srcObject = null;
        toast.success("Face photo ready. You can submit when the rest of the form is complete.");
      }
    };
    reader.readAsDataURL(file);
  };

  const captureFace = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setFaceCapture(canvas.toDataURL("image/png"));
    const stream = video.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    setCapturing(false);
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
                <Input id="idCopy" type="file" onChange={(e) => setIdCopy(e.target.files?.[0] ?? null)} />
              </div>
              <div>
                <Label htmlFor="passportCopy">Passport Copy (optional)</Label>
                <Input
                  id="passportCopy"
                  type="file"
                  onChange={(e) => setPassportCopy(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <Card className="p-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-semibold">Face photo</h2>
                <div className="flex flex-wrap gap-2">
                  {!capturing ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startCamera}
                      disabled={!isSecureCameraContext}
                    >
                      <Camera className="mr-2 h-4 w-4" /> Use camera
                    </Button>
                  ) : (
                    <Button type="button" onClick={captureFace}>
                      Capture from camera
                    </Button>
                  )}
                </div>
              </div>
              {!isSecureCameraContext ? (
                <p className="text-xs text-destructive">
                  Camera access needs HTTPS or localhost. You are on{" "}
                  <strong className="font-semibold">{typeof window !== "undefined" ? window.location.origin : "this origin"}</strong>.
                  Use localhost for testing camera, or upload a face photo below.
                </p>
              ) : null}
              {cameraIssue ? <p className="text-xs text-destructive">{cameraIssue}</p> : null}
              <p className="text-sm text-muted-foreground">
                If the browser blocks the camera, use{" "}
                <strong className="text-foreground">Upload face photo</strong> (clear, front-facing selfie). On Chrome/Edge:
                site icon or lock → Site settings → Camera → Allow.
              </p>
              <div>
                <Label htmlFor="facePhoto">Upload face photo (alternative)</Label>
                <Input
                  id="facePhoto"
                  type="file"
                  accept="image/*"
                  className="mt-1"
                  onChange={(e) => onFacePhotoFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-w-md rounded-md border bg-muted/30"
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

