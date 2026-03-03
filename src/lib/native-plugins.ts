/**
 * Native plugin utilities for Capacitor.
 * These provide graceful fallbacks when running in the browser.
 */
import { Capacitor } from "@capacitor/core";

/**
 * Check if running inside a native Capacitor shell (not just browser)
 */
export const isNativePlatform = () => Capacitor.isNativePlatform();

/**
 * Speech Recognition – uses @capacitor-community/speech-recognition on native,
 * falls back to Web Speech API in browser.
 */
export async function startNativeSpeechRecognition(options: {
  language?: string;
  onPartialResult?: (text: string) => void;
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
}): Promise<{ stop: () => Promise<string> }> {
  const lang = options.language || "sv-SE";

  if (isNativePlatform()) {
    try {
      const { SpeechRecognition } = await import(
        "@capacitor-community/speech-recognition"
      );

      // Request permission
      const permission = await SpeechRecognition.requestPermissions();
      if (permission.speechRecognition !== "granted") {
        throw new Error("Microphone permission denied");
      }

      let fullTranscript = "";

      await SpeechRecognition.start({
        language: lang,
        partialResults: true,
        popup: false,
      });

      // Listen for partial results
      SpeechRecognition.addListener("partialResults", (data: any) => {
        if (data.matches && data.matches.length > 0) {
          const partial = data.matches[0];
          options.onPartialResult?.(partial);
          fullTranscript = partial;
        }
      });

      return {
        stop: async () => {
          await SpeechRecognition.stop();
          SpeechRecognition.removeAllListeners();
          options.onResult?.(fullTranscript);
          return fullTranscript;
        },
      };
    } catch (err: any) {
      console.warn("Native speech recognition failed, falling back to web:", err);
      options.onError?.(err.message || "Native speech failed");
    }
  }

  // Fallback: Web Speech API
  return startWebSpeechRecognition(options, lang);
}

function startWebSpeechRecognition(
  options: {
    onPartialResult?: (text: string) => void;
    onResult?: (text: string) => void;
    onError?: (error: string) => void;
  },
  lang: string
): { stop: () => Promise<string> } {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    options.onError?.("Speech recognition not supported");
    return { stop: async () => "" };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;

  let finalTranscript = "";
  let stopped = false;

  recognition.onresult = (event: any) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript + " ";
      } else {
        interim += result[0].transcript;
      }
    }
    options.onPartialResult?.(finalTranscript.trim() + " " + interim);
  };

  recognition.onerror = (event: any) => {
    if (event.error !== "no-speech") {
      options.onError?.(event.error);
    }
  };

  recognition.onend = () => {
    if (!stopped) {
      try {
        recognition.start();
      } catch {
        // ignore
      }
    }
  };

  recognition.start();

  return {
    stop: async () => {
      stopped = true;
      recognition.onend = null;
      recognition.stop();
      const result = finalTranscript.trim();
      options.onResult?.(result);
      return result;
    },
  };
}

/**
 * Keep Awake – prevents screen from sleeping during recording
 */
export async function keepAwake() {
  if (isNativePlatform()) {
    try {
      const { KeepAwake } = await import("@capacitor-community/keep-awake");
      await KeepAwake.keepAwake();
    } catch {
      // fallback: try Screen Wake Lock API
      tryWebWakeLock();
    }
  } else {
    tryWebWakeLock();
  }
}

export async function allowSleep() {
  if (isNativePlatform()) {
    try {
      const { KeepAwake } = await import("@capacitor-community/keep-awake");
      await KeepAwake.allowSleep();
    } catch {
      // no-op
    }
  }
  releaseWebWakeLock();
}

let wakeLockSentinel: any = null;

async function tryWebWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
    }
  } catch {
    // not available
  }
}

function releaseWebWakeLock() {
  if (wakeLockSentinel) {
    wakeLockSentinel.release();
    wakeLockSentinel = null;
  }
}

/**
 * Haptic feedback
 */
export async function hapticFeedback() {
  if (isNativePlatform()) {
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // no-op
    }
  }
}

/**
 * Local Notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isNativePlatform()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const result = await LocalNotifications.requestPermissions();
      return result.display === "granted";
    } catch {
      return false;
    }
  }
  // Web fallback
  if ("Notification" in window) {
    const result = await Notification.requestPermission();
    return result === "granted";
  }
  return false;
}

export async function sendLocalNotification(title: string, body: string, id?: number) {
  if (isNativePlatform()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: id || Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 100) },
          },
        ],
      });
    } catch (err) {
      console.warn("Failed to send native notification:", err);
    }
  } else if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}
