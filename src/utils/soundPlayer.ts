import Sound from "react-native-sound";
import { Platform } from "react-native";

// Enable playback in silence mode - try 'true' for mixWithOthers and add safety check
if (Platform.OS === "ios") {
  try {
    // Use enableInSilenceMode instead of setCategory to avoid the NSNumber nullability crash
    (
      Sound as unknown as { enableInSilenceMode?: (enabled: boolean) => void }
    ).enableInSilenceMode?.(true);
  } catch (e) {
    console.log("[SoundPlayer] enableInSilenceMode error:", e);
  }
}

let notificationSound: Sound | null = null;
let isSoundLoading = false;
let isSoundPlaying = false;
let autoStopTimer: ReturnType<typeof setTimeout> | null = null;

const MAX_RING_DURATION_MS = 10000;

const clearAutoStopTimer = () => {
  if (autoStopTimer) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }
};

/**
 * Plays the notification sound.
 * On Android, it looks for 'ringtone_notification' in res/raw.
 * On iOS, it looks for the bundled caf/mp3 ringtone files.
 */
export const playNotificationSound = () => {
  // If already playing or loading, don't start another one
  if (isSoundPlaying || isSoundLoading) {
    console.log(
      "[SoundPlayer] Sound is already playing or loading, skipping play request"
    );
    return;
  }

  const soundFiles =
    Platform.OS === "android"
      ? ["ringtone_notification"]
      : ["ringtone-.caf", "ringtone_notification.caf", "ringtone-.mp3"];

  console.log("[SoundPlayer] Attempting to play:", soundFiles[0]);

  isSoundLoading = true;

  loadNotificationSound(soundFiles);
};

const loadNotificationSound = (soundFiles: string[], index = 0) => {
  const soundFile = soundFiles[index];

  notificationSound = new Sound(soundFile, Sound.MAIN_BUNDLE, (error) => {
    isSoundLoading = false;

    if (error) {
      console.log("[SoundPlayer] ❌ Failed to load sound:", error);
      if (index + 1 < soundFiles.length) {
        console.log(
          "[SoundPlayer] Trying fallback sound:",
          soundFiles[index + 1]
        );
        isSoundLoading = true;
        loadNotificationSound(soundFiles, index + 1);
        return;
      }

      isSoundPlaying = false;
      return;
    }

    if (!notificationSound) {
      isSoundPlaying = false;
      return;
    }

    startPlayback();
  });
};

const startPlayback = () => {
  if (!notificationSound) return;

  console.log("[SoundPlayer] ✅ Sound loaded, starting playback");

  notificationSound.setVolume(1.0);
  notificationSound.setNumberOfLoops(0);

  isSoundPlaying = true;
  clearAutoStopTimer();
  autoStopTimer = setTimeout(() => {
    console.log("[SoundPlayer] Auto-stopping notification sound");
    stopNotificationSound();
  }, MAX_RING_DURATION_MS);

  notificationSound.play((success) => {
    clearAutoStopTimer();
    isSoundPlaying = false;
    if (success) {
      console.log("[SoundPlayer] Finished playing successfully");
    } else {
      console.log("[SoundPlayer] ❌ Playback failed");
      notificationSound?.release();
      notificationSound = null;
    }
  });
};

export const stopNotificationSound = () => {
  clearAutoStopTimer();
  if (notificationSound) {
    console.log("[SoundPlayer] Stopping sound");
    notificationSound.stop(() => {
      notificationSound?.release();
      notificationSound = null;
      isSoundPlaying = false;
      isSoundLoading = false;
    });
  } else {
    isSoundPlaying = false;
    isSoundLoading = false;
  }
};
