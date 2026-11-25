"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/lib/i18n/config";

interface RecognitionResult {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionResult) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

const LANGS: Record<Locale, string> = { en: "en-IN", hi: "hi-IN" };

function getCtor(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/**
 * Optional voice input using the browser's built-in speech recognition (only on tap).
 * Some browsers process the audio with their vendor's service; the app itself never records or stores audio.
 */
export function useSpeechInput(locale: Locale, onText: (text: string) => void) {
  const supported = useSyncExternalStore(
    () => () => {},
    () => getCtor() !== undefined,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<"denied" | "failed" | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const handler = useRef(onText);
  useEffect(() => {
    handler.current = onText;
  }, [onText]);
  useEffect(() => () => recognition.current?.stop(), []);

  const toggle = useCallback(() => {
    if (recognition.current) {
      recognition.current.stop();
      return;
    }
    const Ctor = getCtor();
    if (!Ctor) return;
    setError(null);
    const instance = new Ctor();
    instance.lang = LANGS[locale];
    instance.interimResults = false;
    instance.continuous = false;
    instance.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) handler.current(transcript);
    };
    const finish = () => {
      recognition.current = null;
      setListening(false);
    };
    instance.onend = finish;
    instance.onerror = (event) => {
      // "no-speech" and "aborted" are normal (user stayed quiet or tapped Stop), so only report real failures.
      if (event.error === "not-allowed" || event.error === "service-not-allowed") setError("denied");
      else if (event.error && event.error !== "no-speech" && event.error !== "aborted") setError("failed");
      finish();
    };
    recognition.current = instance;
    setListening(true);
    instance.start();
  }, [locale]);

  return { supported, listening, error, toggle };
}
