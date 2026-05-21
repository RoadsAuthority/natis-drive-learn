import { useCallback, useEffect, useRef, useState } from "react";

export type ProctoringSummary = {
  tabSwitches: number;
  faceMissingEvents: number;
  snapshots: string[];
};

type Options = {
  enabled: boolean;
  snapshotIntervalMs?: number;
};

function captureFrame(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 240;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.65);
}

function frameLooksEmpty(video: HTMLVideoElement) {
  if (!video.videoWidth || !video.videoHeight || video.paused || video.ended) {
    return true;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 48;
  const ctx = canvas.getContext("2d");
  if (!ctx) return true;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let total = 0;
  for (let index = 0; index < data.length; index += 4) {
    total += data[index] + data[index + 1] + data[index + 2];
  }
  const average = total / (data.length / 4);
  return average < 18;
}

export function useTestProctoring({ enabled, snapshotIntervalMs = 30000 }: Options) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [faceMissingEvents, setFaceMissingEvents] = useState(0);
  const [snapshots, setSnapshots] = useState<string[]>([]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    if (!enabled) return;
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support webcam monitoring.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch {
      setError("Webcam access is required for monitored testing. Allow camera access or use localhost/HTTPS.");
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !active) return;
    const onVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [active, enabled]);

  useEffect(() => {
    if (!enabled || !active) return;
    const interval = window.setInterval(() => {
      const video = videoRef.current;
      if (!video) return;
      if (frameLooksEmpty(video)) {
        setFaceMissingEvents((prev) => prev + 1);
      }
      const frame = captureFrame(video);
      if (frame) {
        setSnapshots((prev) => [...prev.slice(-4), frame]);
      }
    }, snapshotIntervalMs);
    return () => window.clearInterval(interval);
  }, [active, enabled, snapshotIntervalMs]);

  useEffect(() => () => stop(), [stop]);

  const summary: ProctoringSummary = {
    tabSwitches,
    faceMissingEvents,
    snapshots,
  };

  return {
    videoRef,
    active,
    error,
    tabSwitches,
    faceMissingEvents,
    snapshots,
    summary,
    start,
    stop,
  };
}
