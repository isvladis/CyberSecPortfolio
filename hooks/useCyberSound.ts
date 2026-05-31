import { useCallback, useEffect, useRef } from "react";
import { BEEP_THROTTLE_MS } from "@/lib/constants";

export const useCyberSound = (isAlertMode: boolean) => {
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const beepRef = useRef<HTMLAudioElement | null>(null);
  const lastBeepRef = useRef(0);
  const isBeepUnlockedRef = useRef(false);

  const stopAlarm = useCallback(() => {
    if (!alarmRef.current) return;
    alarmRef.current.pause();
    alarmRef.current.currentTime = 0;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!alarmRef.current) {
      const alarm = new Audio("/sounds/alarm.mp3");
      alarm.loop = false;
      alarm.preload = "auto";
      alarmRef.current = alarm;
    }

    if (!beepRef.current) {
      const beep = new Audio("/sounds/beep.mp3");
      beep.volume = 0.45;
      beep.preload = "auto";
      beepRef.current = beep;
    }

    const unlockBeep = () => {
      if (!beepRef.current || isBeepUnlockedRef.current) return;

      const previousVolume = beepRef.current.volume;
      beepRef.current.volume = 0;
      beepRef.current
        .play()
        .then(() => {
          beepRef.current?.pause();
          if (beepRef.current) {
            beepRef.current.currentTime = 0;
            beepRef.current.volume = previousVolume;
          }
          isBeepUnlockedRef.current = true;
        })
        .catch(() => {
          if (beepRef.current) beepRef.current.volume = previousVolume;
        });
    };

    window.addEventListener("pointerdown", unlockBeep, { once: true });
    window.addEventListener("keydown", unlockBeep, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockBeep);
      window.removeEventListener("keydown", unlockBeep);
      stopAlarm();
    };
  }, [stopAlarm]);

  useEffect(() => {
    if (isAlertMode && alarmRef.current?.paused) {
      alarmRef.current.play().catch(() => {});
      return;
    }

    if (!isAlertMode) {
      stopAlarm();
    }
  }, [isAlertMode, stopAlarm]);

  const playBeep = useCallback(() => {
    const now = performance.now();
    if (!beepRef.current || now - lastBeepRef.current < BEEP_THROTTLE_MS) return;

    lastBeepRef.current = now;
    if (beepRef.current.paused) {
      beepRef.current.currentTime = 0;
      beepRef.current.play().catch(() => {});
      return;
    }

    const clone = beepRef.current.cloneNode(true) as HTMLAudioElement;
    clone.play().catch(() => {});
  }, []);

  return { playBeep, stopAlarm };
};
