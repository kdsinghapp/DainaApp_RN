import { pick, types, isCancel } from '@react-native-documents/picker';
import strings from '../localization/Localization';
import { errorToast } from './customToast';

export interface PickedDocument {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

/**
 * Opens the document picker to select an image or a PDF.
 * Returns a standardized document object or null if cancelled/error.
 */
export const pickDocument = async (): Promise<PickedDocument | null> => {
  try {
    const [result] = await pick({
      type: [types.images, types.pdf],
    });

    if (result && result?.uri) {
      return {
        uri: result?.uri,
        name: result?.name || `doc_${Date.now()}.${result?.type === 'application/pdf' ? 'pdf' : 'jpg'}`,
        type: result?.type || (result?.uri?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        size: result?.size,
      };
    }
    return null;
  } catch (err) {
    if (isCancel(err)) {
      console.log('User cancelled document selection');
    } else {
      console.error('Error picking document:', err);
      errorToast(strings.ErrorPickingDocument || 'Error picking document');
    }
    return null;
  }
};
