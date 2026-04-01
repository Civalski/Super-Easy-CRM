'use client'

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'crm_sound_enabled';
let globalLastPlayed = 0;
const DEBOUNCE_MS = 5000; // 5 seconds debounce to prevent spamming
let globalAudioElement: HTMLAudioElement | null = null;
let globalAudioContext: AudioContext | null = null;
let unlockBound = false;
const NOTIFICATION_AUDIO_SRC = process.env.NEXT_PUBLIC_NOTIFICATION_SOUND_PATH || '/notification.mp3';

function bindAudioUnlock() {
  if (typeof window === 'undefined' || unlockBound) return;

  const unlock = () => {
    if (globalAudioContext && globalAudioContext.state === 'suspended') {
      void globalAudioContext.resume();
    }
  };

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
  unlockBound = true;
}

function playBeepFallback() {
  if (typeof window === 'undefined') return;

  try {
    if (!globalAudioContext) {
      globalAudioContext = new window.AudioContext();
    }

    if (globalAudioContext.state === 'suspended') {
      void globalAudioContext.resume();
    }

    const oscillator = globalAudioContext.createOscillator();
    const gain = globalAudioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, globalAudioContext.currentTime);
    gain.gain.setValueAtTime(0.0001, globalAudioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, globalAudioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, globalAudioContext.currentTime + 0.22);

    oscillator.connect(gain);
    gain.connect(globalAudioContext.destination);
    oscillator.start();
    oscillator.stop(globalAudioContext.currentTime + 0.24);
  } catch {}
}

export function useNotificationSound() {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem(STORAGE_KEY);
      const enabled = val !== 'false';
      setIsEnabled(enabled);
      
      if (!globalAudioElement && NOTIFICATION_AUDIO_SRC) {
        try {
          globalAudioElement = new Audio(NOTIFICATION_AUDIO_SRC);
        } catch {}
      }

      bindAudioUnlock();
    }
  }, []);

  const toggleSound = useCallback(() => {
    setIsEnabled(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
      }
      return next;
    });
  }, []);

  const playSound = useCallback((forcePlay = false) => {
    if (typeof window === 'undefined' || (!isEnabled && !forcePlay)) return;
    
    const now = Date.now();
    if (now - globalLastPlayed < DEBOUNCE_MS && !forcePlay) {
      return; // Debounced
    }

    globalLastPlayed = now;

    if (globalAudioElement) {
      // Create a temporary clone or just use the global one
      // Using global directly is fine but playing can reject if interrupted
      globalAudioElement.currentTime = 0;
      globalAudioElement.play().catch(e => {
        // Falls back to generated beep when media fails to load/play.
        playBeepFallback();
      });
      return;
    }

    playBeepFallback();
  }, [isEnabled]);

  return { isEnabled, toggleSound, playSound };
}
