import { StyleSheet } from "react-native";
import { color } from "../../../constant";
import font from "../../../theme/font";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  logo: {
    width: 158,
    height: 84,
    marginBottom: 40,
  },
  title: {
    fontSize: 20,
    fontFamily: font.TrialMedium
    ,
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#696969',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 80,
    paddingHorizontal: 10,
    fontFamily: font.TrialRegular
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    justifyContent: 'flex-end',
    flex: 1

  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 15,
    width: '100%',
    backgroundColor: '#fff',
  },
  facebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 15,
    width: '100%',
    backgroundColor: '#1877F2',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    backgroundColor: '#fff',
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  appleButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: font.MonolithRegular
  },
  facebookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: font.MonolithRegular

  },
  googleButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: font.MonolithRegular

  },
  button: {
    marginVertical: 8,
    borderRadius: 27,
    // elevation:1
  },
});
