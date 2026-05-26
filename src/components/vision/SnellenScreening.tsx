import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";

type SnellenLine = {
  letters: string;
  sizeRem: number;
  offsetPx: number;
};

type Props = {
  lineCount?: number;
  secondsPerLine?: number;
  passThreshold?: number;
  onComplete: (passed: boolean) => void;
  onCancel?: () => void;
};

function randomLetters(count: number) {
  return Array.from({ length: count })
    .map(() => ALPHABET[Math.floor(Math.random() * ALPHABET.length)])
    .join("");
}

function buildLines(lineCount: number): SnellenLine[] {
  const sizes = [2.6, 2.1, 1.7, 1.35, 1.05, 0.85];
  return Array.from({ length: lineCount }, (_, index) => ({
    letters: randomLetters(index + 1),
    sizeRem: sizes[Math.min(index, sizes.length - 1)],
    offsetPx: Math.floor(Math.random() * 36) - 18,
  }));
}

export default function SnellenScreening({
  lineCount = 5,
  secondsPerLine = 10,
  passThreshold = 0.8,
  onComplete,
  onCancel,
}: Props) {
  const lines = useMemo(() => buildLines(lineCount), [lineCount]);
  const [lineIndex, setLineIndex] = useState(0);
  const [entry, setEntry] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(secondsPerLine);
  const lineIndexRef = useRef(0);
  const correctCountRef = useRef(0);

  const currentLine = lines[lineIndex];
  const progress = ((lineIndex + 1) / lines.length) * 100;

  const advanceLine = useCallback(
    (isCorrect: boolean) => {
      const nextCorrect = correctCountRef.current + (isCorrect ? 1 : 0);
      const nextIndex = lineIndexRef.current + 1;
      if (nextIndex >= lines.length) {
        onComplete(nextCorrect / lines.length >= passThreshold);
        return;
      }
      correctCountRef.current = nextCorrect;
      lineIndexRef.current = nextIndex;
      setCorrectCount(nextCorrect);
      setLineIndex(nextIndex);
      setEntry("");
      setSecondsLeft(secondsPerLine);
    },
    [lines.length, onComplete, passThreshold, secondsPerLine]
  );

  useEffect(() => {
    setSecondsLeft(secondsPerLine);
  }, [lineIndex, secondsPerLine]);

  useEffect(() => {
    if (!currentLine) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          advanceLine(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [advanceLine, currentLine, lineIndex]);

  const submitLine = () => {
    const normalized = entry.replace(/\s+/g, "").toUpperCase();
    const expected = currentLine.letters.toUpperCase();
    advanceLine(normalized === expected);
  };

  if (!currentLine) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Line {lineIndex + 1} of {lines.length}
        </span>
        <span>{secondsLeft}s left on this line</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="rounded-md border bg-card p-6 text-center font-bold tracking-[0.35em]">
        {lines.slice(0, lineIndex + 1).map((line, index) => (
          <p
            key={`${index}-${line.letters}`}
            style={{
              fontSize: `${line.sizeRem}rem`,
              marginLeft: `${line.offsetPx}px`,
              lineHeight: 1.2,
            }}
          >
            {line.letters.split("").join(" ")}
          </p>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="snellen-entry">Type the letters on the current line</Label>
        <Input
          id="snellen-entry"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Enter letters exactly as shown"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={submitLine}>
          Submit line
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}
