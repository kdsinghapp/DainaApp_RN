import Sound from 'react-native-sound';
import { Platform } from 'react-native';

// Enable playback in silence mode - try 'true' for mixWithOthers and add safety check
if (Platform.OS === 'ios') {
  try {
    // Use enableInSilenceMode instead of setCategory to avoid the NSNumber nullability crash
    Sound.enableInSilenceMode(true);
  } catch (e) {
    console.log('[SoundPlayer] enableInSilenceMode error:', e);
  }
}

let notificationSound: Sound | null = null;
let isSoundLoading = false;
let isSoundPlaying = false;

/**
 * Plays the notification sound.
 * On Android, it looks for 'ringtone_notification' in res/raw.
 * On iOS, it looks for 'ringtone_notification.mp3' in the app bundle.
 */
export const playNotificationSound = () => {
  // If already playing or loading, don't start another one
  if (isSoundPlaying || isSoundLoading) {
    console.log('[SoundPlayer] Sound is already playing or loading, skipping play request');
    return;
  }

  const soundFile = Platform.OS === 'android' ? 'ringtone_notification' : 'ringtone_notification.mp3';

  console.log('[SoundPlayer] Attempting to play:', soundFile);

  isSoundLoading = true;

  notificationSound = new Sound(soundFile, Sound.MAIN_BUNDLE, (error) => {
    isSoundLoading = false;

    if (error) {
      console.log('[SoundPlayer] ❌ Failed to load sound:', error);
      // Try loading without Sound.MAIN_BUNDLE (fallback)
      isSoundLoading = true;
      notificationSound = new Sound(soundFile, '', (err) => {
        isSoundLoading = false;
        if (err) {
          console.log('[SoundPlayer] ❌ Fallback load failed:', err);
          isSoundPlaying = false;
          return;
        }
        startPlayback();
      });
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

  console.log('[SoundPlayer] ✅ Sound loaded, starting playback');

  notificationSound.setVolume(1.0);
  notificationSound.setNumberOfLoops(-1); // Loop indefinitely until stopNotificationSound is called

  isSoundPlaying = true;

  notificationSound.play((success) => {
    isSoundPlaying = false;
    if (success) {
      console.log('[SoundPlayer] Finished playing successfully');
    } else {
      console.log('[SoundPlayer] ❌ Playback failed');
      notificationSound?.release();
      notificationSound = null;
    }
  });
};

export const stopNotificationSound = () => {
  if (notificationSound) {
    console.log('[SoundPlayer] Stopping sound');
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
