import { useCallback, useEffect, useRef, useState } from "react";
import type { TestViolationType } from "@/types/proctoring";

export type ProctoringSummary = {
  tabSwitches: number;
  faceMissingEvents: number;
  violationCount: number;
  snapshots: string[];
};

type Options = {
  enabled: boolean;
  snapshotIntervalMs?: number;
  onViolation?: (type: TestViolationType) => Promise<number | void>;
  onThreeStrikes?: () => void;
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

export function useTestProctoring({
  enabled,
  snapshotIntervalMs = 30000,
  onViolation,
  onThreeStrikes,
}: Options) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const violationCountRef = useRef(0);
  const lastFocusViolationAtRef = useRef(0);
  const pendingViolationsRef = useRef<Promise<void>>(Promise.resolve());
  const thirdStrikeTriggeredRef = useRef(false);
  const stoppedRef = useRef(false);
  const onViolationRef = useRef(onViolation);
  const onThreeStrikesRef = useRef(onThreeStrikes);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [faceMissingEvents, setFaceMissingEvents] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [snapshots, setSnapshots] = useState<string[]>([]);

  onViolationRef.current = onViolation;
  onThreeStrikesRef.current = onThreeStrikes;

  const triggerThreeStrikes = useCallback(() => {
    if (violationCountRef.current < 3 || thirdStrikeTriggeredRef.current) return;
    thirdStrikeTriggeredRef.current = true;
    void pendingViolationsRef.current.then(() => onThreeStrikesRef.current?.());
  }, []);

  const recordViolation = useCallback((type: TestViolationType) => {
    if (!enabled || stoppedRef.current) return;

    const focusLoss = type === "tab_switch" || type === "window_blur" || type === "fullscreen_exit";
    const now = Date.now();
    if (focusLoss && now - lastFocusViolationAtRef.current < 1200) return;
    if (focusLoss) lastFocusViolationAtRef.current = now;

    const count = violationCountRef.current + 1;
    violationCountRef.current = count;
    setViolationCount(count);
    if (focusLoss) setTabSwitches((previous) => previous + 1);

    const logViolation = async () => {
      try {
        const serverCount = await onViolationRef.current?.(type);
        if (typeof serverCount === "number" && Number.isInteger(serverCount)) {
          violationCountRef.current = Math.max(violationCountRef.current, serverCount);
          setViolationCount(violationCountRef.current);
        }
      } catch {
        // Continue enforcing the local strike threshold if the audit endpoint is unavailable.
      }
      triggerThreeStrikes();
    };
    pendingViolationsRef.current = pendingViolationsRef.current.then(logViolation, logViolation);
    triggerThreeStrikes();
  }, [enabled, triggerThreeStrikes]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    if (!enabled) return;
    stoppedRef.current = false;
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
    if (!enabled) return;
    const onVisibilityChange = () => {
      if (document.hidden) {
        recordViolation("tab_switch");
      }
    };
    const onWindowBlur = () => recordViolation("window_blur");
    let startedInFullscreen = document.fullscreenElement !== null;
    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        startedInFullscreen = true;
      } else if (startedInFullscreen) {
        startedInFullscreen = false;
        recordViolation("fullscreen_exit");
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [enabled, recordViolation]);

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

  const captureSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video || !active) return null;
    return captureFrame(video);
  }, [active]);

  const flushViolationLogs = useCallback(() => pendingViolationsRef.current, []);
  const syncViolationCount = useCallback((serverCount: number) => {
    if (!Number.isInteger(serverCount) || serverCount < 0) return;
    violationCountRef.current = Math.max(violationCountRef.current, serverCount);
    setViolationCount(violationCountRef.current);
    triggerThreeStrikes();
  }, [triggerThreeStrikes]);

  const summary: ProctoringSummary = {
    tabSwitches,
    faceMissingEvents,
    violationCount,
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
    captureSnapshot,
    start,
    stop,
    recordViolation,
    flushViolationLogs,
    syncViolationCount,
  };
}
