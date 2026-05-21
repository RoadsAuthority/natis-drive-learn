import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type StudyFile = { name: string; url: string };

const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export default function StudyMaterials() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiBase) {
      setError("Set VITE_API_BASE_URL in .env so PDF links can reach the API (e.g. http://localhost:3001).");
      return;
    }
    fetch(`${apiBase}/api/study-materials/list`)
      .then((r) => r.json())
      .then((data: { files?: StudyFile[] }) => setFiles(data.files ?? []))
      .catch(() => setError("Could not load file list. Is the API running (npm run dev:api)?"));
  }, []);

  const href = (rel: string) => `${apiBase}${rel}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Study materials</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Official PDFs from the <code className="text-xs">RoadsAuth</code> folder are served by the API for
                download. The online test uses structured questions in the database (see import below).
              </p>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {!error && files.length === 0 ? (
            <p className="text-sm text-muted-foreground">No PDFs found in RoadsAuth. Add .pdf files there and restart the API.</p>
          ) : null}

          <ul className="space-y-2">
            {files.map((f) => (
              <li key={f.name}>
                <a
                  href={href(f.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium hover:bg-muted/50"
                >
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 space-y-3 text-sm text-muted-foreground">
          <h2 className="text-base font-semibold text-foreground">Online test questions</h2>
          <p>
            PDF question papers are not auto-imported. Add each multiple-choice item to{" "}
            <code className="text-xs text-foreground">data/question-bank.json</code> (same shape as the samples), then
            run:
          </p>
          <pre className="rounded-md bg-muted p-3 text-xs text-foreground overflow-x-auto">
            npm run seed:questions -- --replace
          </pre>
          <p>
            Use <code className="text-xs">--replace</code> only when you want to wipe and reload the whole bank.
            Option <code className="text-xs">id</code> values should match what learners tap (e.g. a–d); marking is
            case-insensitive.
          </p>
        </Card>
      </div>
    </div>
  );
}
