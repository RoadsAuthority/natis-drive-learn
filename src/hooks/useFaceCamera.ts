import { useCallback, useEffect, useRef, useState } from "react";

function captureFrame(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function useFaceCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCapturing(false);
    setReady(false);
  }, []);

  const attachStream = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return false;
    video.srcObject = stream;
    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        video.removeEventListener("loadedmetadata", onReady);
        resolve();
      };
      video.addEventListener("loadedmetadata", onReady);
      if (video.readyState >= 1) {
        video.removeEventListener("loadedmetadata", onReady);
        resolve();
      }
      video.onerror = () => reject(new Error("Video failed to load."));
    });
    await video.play();
    setReady(video.videoWidth > 0);
    return video.videoWidth > 0;
  }, []);

  const start = useCallback(async (): Promise<string | null> => {
    setError(null);
    setReady(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      const message = "This browser does not support the camera. Upload a face photo instead.";
      setError(message);
      return message;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCapturing(true);
      const attached = await attachStream(stream);
      if (!attached) {
        const message = "Camera started but preview is not ready. Try again or upload a photo.";
        setError(message);
        return message;
      }
      return null;
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      let message = "Could not start the camera. Upload a face photo instead.";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        message = "Camera blocked. Allow camera access in your browser settings, or upload a photo.";
      } else if (name === "NotFoundError") {
        message = "No camera found. Upload a face photo instead.";
      }
      setError(message);
      stop();
      return message;
    }
  }, [attachStream, stop]);

  useEffect(() => {
    if (!capturing || !streamRef.current) return;
    void attachStream(streamRef.current);
  }, [capturing, attachStream]);

  useEffect(() => () => stop(), [stop]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !ready || video.videoWidth === 0) {
      return null;
    }
    const frame = captureFrame(video);
    if (frame) {
      stop();
    }
    return frame;
  }, [ready, stop]);

  return {
    videoRef,
    capturing,
    ready,
    error,
    start,
    stop,
    capture,
  };
}
