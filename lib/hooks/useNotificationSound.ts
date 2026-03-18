'use client'

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'crm_sound_enabled';
let globalLastPlayed = 0;
const DEBOUNCE_MS = 5000; // 5 seconds debounce to prevent spamming
let globalAudioElement: HTMLAudioElement | null = null;

export function useNotificationSound() {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem(STORAGE_KEY);
      const enabled = val !== 'false';
      setIsEnabled(enabled);
      
      if (!globalAudioElement) {
        try {
          globalAudioElement = new Audio('/notification.mp3');
        } catch {}
      }
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
        // no-op, typically because the user hasn't interacted with the page yet
      });
    }
  }, [isEnabled]);

  return { isEnabled, toggleSound, playSound };
}
