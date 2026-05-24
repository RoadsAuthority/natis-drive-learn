import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { VerificationQueueRow } from "@/lib/adminApi";
import { isImageDocumentUrl, isPdfDocumentUrl, resolveDocumentUrl } from "@/lib/documentUrl";

type Props = {
  apiBase: string;
  candidate: VerificationQueueRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DocSlot = {
  label: string;
  path: string | null | undefined;
  data: string | null | undefined;
};

function DocumentPreview({ label, url }: { label: string; url: string }) {
  if (isImageDocumentUrl(url)) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img src={url} alt={label} className="max-h-64 w-full rounded-md border object-contain bg-muted/30" />
        </a>
      </div>
    );
  }

  if (isPdfDocumentUrl(url)) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noreferrer">
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
        <a href={url} target="_blank" rel="noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          Open file
        </a>
      </Button>
    </div>
  );
}

export default function VerificationDocumentsDialog({ apiBase, candidate, open, onOpenChange }: Props) {
  if (!candidate) return null;

  const slots: DocSlot[] = [
    { label: "ID copy", path: candidate.id_copy_path, data: candidate.id_copy_data },
    { label: "Passport copy", path: candidate.passport_copy_path, data: candidate.passport_copy_data },
    { label: "Face photo", path: candidate.face_capture_path, data: candidate.face_capture_data },
    { label: "Doctor letter", path: candidate.doctor_letter_path, data: null },
  ];

  const resolved = slots
    .map((slot) => ({
      ...slot,
      url: resolveDocumentUrl(apiBase, slot.path, slot.data),
    }))
    .filter((slot) => slot.url);

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

        {resolved.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documents on file. The candidate may need to resubmit, or files were lost after a server restart (use
            upload again on the candidate side).
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {resolved.map((slot) => (
              <DocumentPreview key={slot.label} label={slot.label} url={slot.url!} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
