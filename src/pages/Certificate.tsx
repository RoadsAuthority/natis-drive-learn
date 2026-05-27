import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import LearnerCertificate from "@/components/certificate/LearnerCertificate";
import { fetchMyCertificate, type CertificateData } from "@/lib/certificateApi";

export default function Certificate() {
  const navigate = useNavigate();
  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const cert = await fetchMyCertificate();
        if (!cert) {
          toast.error("Sign in to view your certificate.");
          navigate("/login");
          return;
        }
        setData(cert);
      } catch (e) {
        toast.error((e as Error).message);
        navigate("/portal");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading certificate…</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl space-y-6 print:max-w-none">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button variant="ghost" onClick={() => navigate("/my-profile")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to profile
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print / Save PDF
            </Button>
            <Button onClick={handlePrint}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <LearnerCertificate data={data} />

        <p className="text-center text-sm text-muted-foreground print:hidden">
          Use Print and choose &quot;Save as PDF&quot; to download a copy for your records.
        </p>
      </div>
    </div>
  );
}
