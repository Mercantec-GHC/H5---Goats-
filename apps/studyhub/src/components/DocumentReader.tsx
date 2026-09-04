"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./DocumentReader.module.css";

type DocumentReaderProps = {
  text: string;
  title?: string;
};

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function DocumentReader({
  text,
  title = "Document",
}: DocumentReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);

  const currentIndexRef = useRef(0);
  const chunksRef = useRef<string[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const supported = useMemo(() => {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }, []);

  /*
   * Opdel i bider, så browsers ikke får problemer med for store SpeechSynthesisUtterance objekter.
   */
  const chunks = useMemo(() => {
    if (!text.trim()) return [];

    const cleanedText = text
      .replace(/\s+/g, " ")
      .replace(/\n+/g, " ")
      .trim();

    const sentences = cleanedText.match(/[^.!?]+[.!?]+/g) ?? [cleanedText];

    const result: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();

      if (!trimmedSentence) continue;

      if (
        currentChunk.length + trimmedSentence.length > 220 &&
        currentChunk.length > 0
      ) {
        result.push(currentChunk.trim());
        currentChunk = "";
      }

      currentChunk += `${trimmedSentence} `;
    }

    if (currentChunk.trim()) {
      result.push(currentChunk.trim());
    }

    return result;
  }, [text]);

  /*
   * Load available browser voices.
   */
  useEffect(() => {
    if (!supported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();

      setVoices(availableVoices);

      if (!selectedVoice && availableVoices.length > 0) {
        const preferredVoice =
          availableVoices.find((voice) =>
            voice.lang.toLowerCase().startsWith("da")
          ) ??
          availableVoices.find((voice) =>
            voice.lang.toLowerCase().startsWith("en")
          ) ??
          availableVoices[0];

        setSelectedVoice(preferredVoice);
      }
    };

    loadVoices();

    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        loadVoices
      );
    };
  }, [supported, selectedVoice]);

  /*
   * Stop speech when component unmounts.
   */
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakChunk = (index: number) => {
    if (!supported) return;

    if (index >= chunksRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      currentIndexRef.current = 0;
      return;
    }

    const chunk = chunksRef.current[index];

    const utterance = new SpeechSynthesisUtterance(chunk);

    utterance.rate = rate;
    utterance.volume = volume;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      currentIndexRef.current = index + 1;

      if (currentIndexRef.current < chunksRef.current.length) {
        speakChunk(currentIndexRef.current);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        currentIndexRef.current = 0;
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;

    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    if (!supported || chunks.length === 0) return;

    chunksRef.current = chunks;

    /*
     * Hvis paused, fortsætter den med det den allerede oplæser, i stedet for at starte forfra
     */
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    /*
     * Hvis allerede oplæser, gør ikke noget
     */
    if (window.speechSynthesis.speaking) {
      return;
    }

    currentIndexRef.current = 0;
    speakChunk(0);
  };

  const handlePause = () => {
    if (!supported) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    if (!supported) return;

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (!supported) return;

    window.speechSynthesis.cancel();

    currentIndexRef.current = 0;

    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);

    /*
     * Hastigheden ændres, så hvis den allerede oplæser, skal den stoppe og starte forfra med den nye hastighed
     */
    if (isPlaying && supported) {
      window.speechSynthesis.cancel();

      setTimeout(() => {
        speakChunk(currentIndexRef.current);
      }, 50);
    }
  };

  const handleVoiceChange = (voiceName: string) => {
    const voice = voices.find((item) => item.name === voiceName);

    if (!voice) return;

    setSelectedVoice(voice);

    if (isPlaying && supported) {
      window.speechSynthesis.cancel();

      setTimeout(() => {
        speakChunk(currentIndexRef.current);
      }, 50);
    }
  };

  const progress =
    chunks.length > 0
      ? Math.min(
          ((currentIndexRef.current + (isPlaying ? 1 : 0)) / chunks.length) *
            100,
          100
        )
      : 0;

  if (!supported) {
    return (
      <div className={styles.reader}>
        <div className={styles.unsupported}>
          <span className={styles.unsupportedIcon}>🔊</span>

          <div>
            <strong>Read aloud is not supported</strong>
            <p>
              Your browser does not support text-to-speech.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className={styles.reader} aria-label="Document reader">
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.icon}>🔊</div>

          <div>
            <p className={styles.eyebrow}>STUDYDOCS READER</p>
            <h3>{title}</h3>
          </div>
        </div>

        {isPlaying && (
          <div className={styles.status}>
            <span className={styles.statusDot} />
            {isPaused ? "Paused" : "Reading"}
          </div>
        )}
      </div>

      <div className={styles.progressArea}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className={styles.progressText}>
          {isPlaying
            ? `Part ${Math.min(
                currentIndexRef.current + 1,
                chunks.length
              )} of ${chunks.length}`
            : `${chunks.length} parts`}
        </span>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.mainButton}
          onClick={isPaused ? handleResume : handlePlay}
          disabled={chunks.length === 0}
          aria-label={isPaused ? "Resume reading" : "Start reading"}
        >
          {isPaused ? "▶" : "▶"}
          <span>{isPaused ? "Resume" : "Read aloud"}</span>
        </button>

        <button
          type="button"
          className={styles.controlButton}
          onClick={handlePause}
          disabled={!isPlaying || isPaused}
          aria-label="Pause reading"
        >
          ⏸
        </button>

        <button
          type="button"
          className={styles.controlButton}
          onClick={handleStop}
          disabled={!isPlaying && !isPaused}
          aria-label="Stop reading"
        >
          ■
        </button>

        <div className={styles.divider} />

        <label className={styles.selectWrapper}>
          <span>Speed</span>

          <select
            value={rate}
            onChange={(event) =>
              handleRateChange(Number(event.target.value))
            }
          >
            {SPEEDS.map((speed) => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        </label>

        {voices.length > 0 && (
          <label className={styles.selectWrapper}>
            <span>Voice</span>

            <select
              value={selectedVoice?.name ?? ""}
              onChange={(event) =>
                handleVoiceChange(event.target.value)
              }
            >
              {voices.map((voice) => (
                <option
                  key={`${voice.name}-${voice.lang}`}
                  value={voice.name}
                >
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>
        )}

        <label className={styles.volume}>
          <span>🔊</span>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) =>
              setVolume(Number(event.target.value))
            }
            aria-label="Volume"
          />
        </label>
      </div>
    </section>
  );
}