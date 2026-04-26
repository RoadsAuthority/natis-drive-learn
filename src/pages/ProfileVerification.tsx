import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitProfileVerification } from "@/lib/natisApi";

export default function ProfileVerification() {
  const navigate = useNavigate();
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCapturing(true);
      }
    } catch {
      toast.error("Camera access was denied.");
    }
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
    if (!idCopy && !passportCopy) {
      toast.error("Upload an ID copy or passport.");
      return;
    }
    if (!faceCapture) {
      toast.error("Capture your face photo before submitting.");
      return;
    }

    try {
      const payload = new FormData();
      payload.append("firstName", formData.firstName);
      payload.append("surname", formData.surname);
      payload.append("idNumber", formData.idNumber);
      payload.append("licenceCode", formData.licenceCode);
      if (idCopy) payload.append("idCopy", idCopy);
      if (passportCopy) payload.append("passportCopy", passportCopy);
      payload.append("faceCaptureBase64", faceCapture);
      await submitProfileVerification(payload);
      localStorage.setItem("profile", JSON.stringify(formData));
      toast.success("Verification submitted. Admin review is required.");
      navigate("/eye-test");
    } catch {
      toast.error("Failed to submit verification.");
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

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Face Capture</h2>
                {!capturing ? (
                  <Button type="button" variant="outline" onClick={startCamera}>
                    <Camera className="mr-2 h-4 w-4" /> Start Camera
                  </Button>
                ) : (
                  <Button type="button" onClick={captureFace}>
                    Capture
                  </Button>
                )}
              </div>
              <video ref={videoRef} autoPlay className="w-full max-w-md rounded-md mt-3" />
              {faceCapture ? <img src={faceCapture} alt="Face capture" className="mt-3 max-w-md rounded-md" /> : null}
            </Card>

            <Button type="submit" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Submit for Admin Verification
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

