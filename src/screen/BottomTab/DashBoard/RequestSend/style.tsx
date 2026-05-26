import { StyleSheet } from "react-native";
import font from "../../../../theme/font";
export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFCC00' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    position: 'relative',
    height: 200,
    width: 200,
  },
  emptyText: {
    fontSize: 15, color: 'black',
    fontFamily: font.MonolithRegular,

  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  locationIcon: { height: 60, width: 60, tintColor: '#FFCC00' },
  pulseCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },
  pulseCircle2: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  textContainer: { alignItems: 'center', marginBottom: 32 },
  loadingTitle: {
    fontSize: 20,
    color: 'black',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: font.MonolithRegular
  },
  driverStatus: { color: 'white', marginTop: 8, fontSize: 16 },
  statusContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 48,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  statusText: { fontSize: 15, color: 'black', letterSpacing: 0.3 },
});
