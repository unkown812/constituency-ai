"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Play, Trash2, Loader2 } from "lucide-react";
import { cn, Button } from "../ui";

type RecorderState = "idle" | "recording" | "recorded" | "uploading";

interface VoiceRecorderProps {
  onTranscriptionComplete: (transcript: string) => void;
  className?: string;
  apiEndpoint?: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({
  onTranscriptionComplete,
  className,
  apiEndpoint = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/transcribe`,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("recorded");
      };

      recorder.start();
      setState("recording");
      setDuration(0);

      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 200);
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow microphone permissions."
          : "Could not start recording. Please try again."
      );
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      cleanup();
    }
  }, [cleanup]);

  const transcribe = useCallback(async () => {
    if (!audioUrl) return;
    setState("uploading");
    setError(null);

    try {
      const blob = await fetch(audioUrl).then((r) => r.blob());
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await fetch(apiEndpoint, { method: "POST", body: formData });

      if (!res.ok) throw new Error("Transcription failed");

      const data = await res.json();
      onTranscriptionComplete(data.transcript || data.transcript_en || "");
      setState("idle");
      setAudioUrl(null);
      setDuration(0);
    } catch {
      onTranscriptionComplete("");
      setState("recorded");
      setError("Transcription failed. Please try again.");
    }
  }, [audioUrl, apiEndpoint, onTranscriptionComplete]);

  const reset = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setState("idle");
  }, [audioUrl]);

  return (
    <div className={cn("bg-canvas border border-border rounded-xl p-4", className)}>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
            state === "recording" && "bg-error/10",
            state === "idle" && "bg-surface",
            state === "recorded" && "bg-success/10",
            state === "uploading" && "bg-surface"
          )}
        >
          {state === "idle" && <Mic className="w-5 h-5 text-muted" />}
          {state === "recording" && (
            <div className="relative flex items-center justify-center">
              <span className="absolute w-10 h-10 rounded-full bg-error/20 animate-ping" />
              <Mic className="w-5 h-5 text-error" />
            </div>
          )}
          {state === "recorded" && <Play className="w-5 h-5 text-success" />}
          {state === "uploading" && (
            <Loader2 className="w-5 h-5 text-muted animate-spin" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {state === "idle" && (
            <p className="text-body text-secondary">
              Tap to start recording your issue
            </p>
          )}
          {state === "recording" && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse-soft" />
              <span className="text-heading-sm text-error font-medium tabular-nums">
                {formatDuration(duration)}
              </span>
              <span className="text-body text-secondary">Recording...</span>
            </div>
          )}
          {state === "recorded" && (
            <div className="flex items-center gap-2">
              <span className="text-heading-sm text-text font-medium tabular-nums">
                {formatDuration(duration)}
              </span>
              <span className="text-body text-secondary">Recorded</span>
            </div>
          )}
          {state === "uploading" && (
            <p className="text-body text-secondary">Transcribing audio...</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {state === "idle" && (
            <Button
              variant="icon"
              size="sm"
              onClick={startRecording}
              aria-label="Start recording"
            >
              <Mic className="w-4 h-4" />
            </Button>
          )}
          {state === "recording" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={stopRecording}
              className="!w-9 !h-9 !rounded-full"
              aria-label="Stop recording"
            >
              <Square className="w-4 h-4" />
            </Button>
          )}
          {state === "recorded" && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={transcribe}
                className="!rounded-full"
              >
                <Play className="w-3.5 h-3.5" />
                Transcribe
              </Button>
              <Button
                variant="icon"
                size="sm"
                onClick={reset}
                className="!w-9 !h-9 !rounded-full"
                aria-label="Delete recording"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-body text-error flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
          {error}
        </p>
      )}

      {state === "recording" && (
        <div className="mt-3 h-1 bg-surface rounded-full overflow-hidden">
          <div className="h-full bg-error rounded-full animate-pulse-soft" style={{ width: "100%" }} />
        </div>
      )}
    </div>
  );
}
