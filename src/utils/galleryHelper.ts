import { launchImageLibrary } from 'react-native-image-picker';
import type { Asset, ImagePickerResponse } from 'react-native-image-picker';

const defaultOptions = {
  mediaType: 'photo' as const,
  quality: 0.8 as const,
};

export type OpenGalleryResult = { asset: Asset } | { cancelled: true } | { error: string };

const MODAL_CLOSE_DELAY_MS = 400;

/**
 * Opens the image library to select a photo.
 * Handles cancel and errors.
 */
export async function openGallery(): Promise<OpenGalleryResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      launchImageLibrary(defaultOptions, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          resolve({ cancelled: true });
          return;
        }
        if (response.errorCode) {
          const message =
            response.errorCode === 'permission'
              ? 'Storage permission denied'
              : response.errorMessage ?? 'Gallery error';
          resolve({ error: message });
          return;
        }
        const asset = response.assets?.[0];
        if (asset?.uri) {
          resolve({ asset });
        } else {
          resolve({ error: 'No photo selected' });
        }
      });
    }, MODAL_CLOSE_DELAY_MS);
  });
}
