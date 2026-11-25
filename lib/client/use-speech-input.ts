"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LIMITS } from "@/lib/limits";

export type SpeechState = "idle" | "listening" | "transcribing";
export type SpeechError = "denied" | "failed";

function isSupported(): boolean {
  return typeof MediaRecorder !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function";
}

/** Chrome/Firefox record webm/opus, Safari records mp4; let the browser pick the first one it can do. */
function pickMimeType(): string | undefined {
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((type) =>
    MediaRecorder.isTypeSupported(type),
  );
}

/**
 * Optional voice input, only on tap: records a short clip, sends it to /api/transcribe and hands back the text.
 * Works the same in every modern browser (unlike the built-in SpeechRecognition, which fails in many of them).
 * The audio is only used to make the text; it is never stored.
 */
export function useSpeechInput(onText: (text: string) => void) {
  const supported = useSyncExternalStore(
    () => () => {},
    isSupported,
    () => false,
  );
  const [state, setState] = useState<SpeechState>("idle");
  const [error, setError] = useState<SpeechError | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abort = useRef<AbortController | null>(null);
  const handler = useRef(onText);
  useEffect(() => {
    handler.current = onText;
  }, [onText]);

  const releaseMic = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }, []);

  useEffect(
    () => () => {
      abort.current?.abort();
      if (recorder.current?.state === "recording") {
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      releaseMic();
    },
    [releaseMic],
  );

  const send = useCallback(async (blob: Blob) => {
    setState("transcribing");
    const controller = new AbortController();
    abort.current = controller;
    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": blob.type || "audio/webm" },
        body: blob,
        signal: controller.signal,
      });
      const json = (await response.json().catch(() => null)) as { text?: unknown } | null;
      const text = typeof json?.text === "string" ? json.text.trim() : "";
      if (!response.ok || !text) setError("failed");
      else handler.current(text);
    } catch {
      if (!controller.signal.aborted) setError("failed");
    } finally {
      if (abort.current === controller) abort.current = null;
      if (!controller.signal.aborted) setState("idle");
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const name = (e as { name?: string } | null)?.name;
      setError(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "failed");
      return;
    }
    stream.current = media;
    const mimeType = pickMimeType();
    const instance = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    instance.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    instance.onstop = () => {
      recorder.current = null;
      releaseMic();
      const blob = new Blob(chunks, { type: instance.mimeType || mimeType || "audio/webm" });
      if (blob.size === 0 || blob.size > LIMITS.audioMaxBytes) {
        setState("idle");
        setError("failed");
        return;
      }
      void send(blob);
    };
    recorder.current = instance;
    instance.start();
    setState("listening");
    // Never leave the mic on: stop on our own after the time limit.
    timer.current = setTimeout(() => {
      if (instance.state === "recording") instance.stop();
    }, LIMITS.speechMaxSeconds * 1000);
  }, [releaseMic, send]);

  /** First tap starts recording, second tap stops it and turns the clip into text. */
  const toggle = useCallback(() => {
    if (state === "transcribing") return;
    if (recorder.current?.state === "recording") {
      recorder.current.stop();
      return;
    }
    void start();
  }, [start, state]);

  return { supported, state, listening: state === "listening", transcribing: state === "transcribing", error, toggle };
}
