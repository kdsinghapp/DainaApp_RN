import Snackbar from 'react-native-snackbar';

export const Toast = (
  text: string,
  backgroundColor?: string,
  marginBottom?: number,
  textColor?: string
) => {
  Snackbar.show({
    text,
    backgroundColor: backgroundColor ?? '#333',
    textColor: textColor ?? '#ffffff',
    duration: Snackbar.LENGTH_SHORT,
    marginBottom: marginBottom ?? 10,
  });
};
export const RedToast = (
  text: string,
  backgroundColor?: string,
  marginBottom?: number,
  textColor?: string
) => {
  Snackbar.show({
    text,
    backgroundColor: backgroundColor ?? '#333',
    textColor: textColor ?? '#ffffff',
    duration: Snackbar.LENGTH_SHORT,
    marginBottom: marginBottom ?? 10,
  });

};
