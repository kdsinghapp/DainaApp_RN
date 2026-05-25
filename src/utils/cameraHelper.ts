import { Platform } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import type { Asset, ImagePickerResponse } from 'react-native-image-picker';
import { requestCameraPermissions } from '../Api';

const MODAL_CLOSE_DELAY_MS = 400;

const defaultOptions = {
  mediaType: 'photo' as const,
  quality: 0.8 as const,
  cameraType: 'back' as const,
};

export type OpenCameraResult = { asset: Asset } | { cancelled: true } | { error: string };


export async function openCamera(
  onResult: (result: OpenCameraResult) => void
): Promise<void> {
  if (Platform.OS === 'android') {
    const granted = await requestCameraPermissions();
    if (!granted) {
      onResult({ error: 'Camera permission is required' });
      return;
    }
  }

  // Let modal close before opening camera (avoids "camera not opening" on some devices)
  setTimeout(() => {
    launchCamera(defaultOptions, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        onResult({ cancelled: true });
        return;
      }
      if (response.errorCode) {
        const message =
          response.errorCode === 'permission'
            ? 'Camera permission denied'
            : response.errorMessage ?? 'Camera error';
        onResult({ error: message });
        return;
      }
      const asset = response.assets?.[0];
      if (asset?.uri) {
        onResult({ asset });
      } else {
        onResult({ error: 'No photo captured' });
      }
    });
  }, MODAL_CLOSE_DELAY_MS);
}
