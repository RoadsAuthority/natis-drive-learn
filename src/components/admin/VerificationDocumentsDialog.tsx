import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchAdminDocument, type VerificationQueueRow } from "@/lib/adminApi";
import type { AdminDocumentKind } from "@/lib/documentUrl";
import { isImageDocumentUrl, isPdfDocumentUrl } from "@/lib/documentUrl";

type Props = {
  candidate: VerificationQueueRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DocSlot = {
  label: string;
  kind: AdminDocumentKind;
  available: boolean;
};

function DocumentPreview({
  label,
  objectUrl,
  mimeType,
}: {
  label: string;
  objectUrl: string;
  mimeType: string;
}) {
  const isImage = mimeType.startsWith("image/") || isImageDocumentUrl(objectUrl);
  const isPdf = mimeType === "application/pdf" || isPdfDocumentUrl(objectUrl);

  if (isImage) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <a href={objectUrl} target="_blank" rel="noreferrer" className="block">
          <img src={objectUrl} alt={label} className="max-h-64 w-full rounded-md border object-contain bg-muted/30" />
        </a>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <Button variant="outline" size="sm" asChild>
          <a href={objectUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open PDF
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <Button variant="outline" size="sm" asChild>
        <a href={objectUrl} target="_blank" rel="noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          Open file
        </a>
      </Button>
    </div>
  );
}

function DocumentSlot({ profileId, label, kind, available }: DocSlot & { profileId: string }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("application/octet-stream");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!available) return;

    let active = true;
    let revokeUrl: string | null = null;

    const load = async () => {
      setLoading(true);
      setError(null);
      setObjectUrl(null);
      try {
        const result = await fetchAdminDocument(profileId, kind);
        if (!active || !result) return;
        revokeUrl = result.objectUrl;
        setObjectUrl(result.objectUrl);
        setMimeType(result.blob.type || "application/octet-stream");
      } catch (e) {
        if (active) {
          setError((e as Error).message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, [available, profileId, kind]);

  if (!available) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading {label.toLowerCase()}…
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!objectUrl) {
    return null;
  }

  return <DocumentPreview label={label} objectUrl={objectUrl} mimeType={mimeType} />;
}

export default function VerificationDocumentsDialog({ candidate, open, onOpenChange }: Props) {
  if (!candidate) return null;

  const slots: DocSlot[] = [
    { label: "ID copy", kind: "id", available: Boolean(candidate.has_id_copy) },
    { label: "Passport copy", kind: "passport", available: Boolean(candidate.has_passport_copy) },
    { label: "Face photo", kind: "face", available: Boolean(candidate.has_face_capture) },
    { label: "Doctor letter", kind: "doctor", available: Boolean(candidate.has_doctor_letter) },
  ];

  const availableSlots = slots.filter((slot) => slot.available);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Documents — {(candidate.first_name ?? "").trim()} {(candidate.surname ?? "").trim()}
          </DialogTitle>
          <DialogDescription>
            {candidate.email}
            {candidate.id_number ? ` · ID ${candidate.id_number}` : ""}
          </DialogDescription>
        </DialogHeader>

        {availableSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documents on file. Ask the candidate to submit verification again (new uploads are saved in the
            database and work after server restarts).
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {availableSlots.map((slot) => (
              <DocumentSlot key={slot.kind} profileId={candidate.id} {...slot} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
