import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import strings from "../localization/Localization";
import font from "../theme/font";

const CURRENT_APP_VERSION = "1.0";
const IOS_APP_ID = "6777900970";
const IOS_STORE_URL = `https://apps.apple.com/in/app/daina/id${IOS_APP_ID}`;
const ANDROID_PACKAGE_NAME = "com.DainaApp";
const ANDROID_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;
const ANDROID_VERSION_URL = "";
const DISMISSED_UPDATE_VERSION_KEY = "dismissed_update_version";

type UpdateInfo = {
  latestVersion: string;
  storeUrl: string;
};

const compareVersions = (currentVersion: string, latestVersion: string) => {
  const currentParts = currentVersion.split(".").map((part) => Number(part) || 0);
  const latestParts = latestVersion.split(".").map((part) => Number(part) || 0);
  const length = Math.max(currentParts.length, latestParts.length);

  for (let index = 0; index < length; index += 1) {
    const current = currentParts[index] ?? 0;
    const latest = latestParts[index] ?? 0;
    if (latest > current) return 1;
    if (latest < current) return -1;
  }

  return 0;
};

const fetchIosUpdateInfo = async (): Promise<UpdateInfo | null> => {
  const response = await fetch(`https://itunes.apple.com/lookup?id=${IOS_APP_ID}&country=in`, {
    headers: { "Cache-Control": "no-cache" },
  });
  const data = await response.json();
  const app = data?.results?.[0];

  if (!app?.version) return null;

  return {
    latestVersion: String(app.version),
    storeUrl: app.trackViewUrl || IOS_STORE_URL,
  };
};

const fetchAndroidUpdateInfo = async (): Promise<UpdateInfo | null> => {
  if (!ANDROID_VERSION_URL) return null;

  const response = await fetch(ANDROID_VERSION_URL, {
    headers: { "Cache-Control": "no-cache" },
  });
  const data = await response.json();
  const version = data?.android ?? data?.version;

  if (!version) return null;

  return {
    latestVersion: String(version),
    storeUrl: ANDROID_STORE_URL,
  };
};

const AppUpdateModal = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);

  const storeUrl = useMemo(
    () => updateInfo?.storeUrl || (Platform.OS === "ios" ? IOS_STORE_URL : ANDROID_STORE_URL),
    [updateInfo?.storeUrl],
  );

  useEffect(() => {
    let cancelled = false;

    const checkForUpdate = async () => {
      if (__DEV__) return;
      setChecking(true);

      try {
        const info = Platform.OS === "ios"
          ? await fetchIosUpdateInfo()
          : await fetchAndroidUpdateInfo();

        if (!info || compareVersions(CURRENT_APP_VERSION, info.latestVersion) !== 1) return;

        const dismissedVersion = await AsyncStorage.getItem(DISMISSED_UPDATE_VERSION_KEY);
        if (!cancelled && dismissedVersion !== info.latestVersion) {
          setUpdateInfo(info);
        }
      } catch (error) {
        console.warn("[AppUpdateModal] Version check failed:", error);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    checkForUpdate();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClose = async () => {
    if (updateInfo?.latestVersion) {
      await AsyncStorage.setItem(DISMISSED_UPDATE_VERSION_KEY, updateInfo.latestVersion);
    }
    setUpdateInfo(null);
  };

  const handleUpdate = async () => {
    try {
      await Linking.openURL(storeUrl);
    } catch (error) {
      console.warn("[AppUpdateModal] Open store failed:", error);
    }
  };

  if (!updateInfo && !checking) return null;

  return (
    <Modal
      visible={Boolean(updateInfo)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeButton} activeOpacity={0.8} onPress={handleClose}>
            <Text style={styles.closeButtonText}>x</Text>
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            {checking ? (
              <ActivityIndicator color="#111827" size="small" />
            ) : (
              <Text style={styles.iconText}>!</Text>
            )}
          </View>

          <Text style={styles.title}>{strings.UpdateAvailableTitle || "Update Available"}</Text>
          <Text style={styles.message}>
            {strings.UpdateAvailableMessage || "A new version of Daina is available. Please update the app for the latest features and bug fixes."}
          </Text>

          {updateInfo?.latestVersion ? (
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>
                {strings.formatString
                  ? String(strings.formatString(strings.VersionUpdateText || "Current {0} - Latest {1}", CURRENT_APP_VERSION, updateInfo.latestVersion))
                  : `Current ${CURRENT_APP_VERSION} - Latest ${updateInfo.latestVersion}`}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.updateButton} activeOpacity={0.85} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>{strings.UpdateNow || "Update Now"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterButton} activeOpacity={0.85} onPress={handleClose}>
            <Text style={styles.laterButtonText}>{strings.Later || "Later"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.60)",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    zIndex: 2,
  },
  closeButtonText: {
    color: "#475569",
    fontSize: 18,

    lineHeight: 20,
    fontFamily: font.MonolithRegular
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFCC00",
    marginBottom: 18,
  },
  iconText: {
    color: "white",
    fontSize: 30,
    lineHeight: 30,
    fontFamily: font.MonolithRegular
  },
  title: {
    color: "#111827",
    fontSize: 20, fontFamily: font.MonolithRegular
    ,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  message: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
  versionBadge: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
  },
  versionText: {
    color: "#64748B",
    fontSize: 12,
    fontFamily: font.MonolithRegular
    ,
    letterSpacing: 0.4,
  },
  updateButton: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFCC00",
    marginTop: 22,
  },
  updateButtonText: {
    color: "#111827",
    fontSize: 15,
    fontFamily: font.MonolithRegular
    ,
    letterSpacing: 0.3,
  },
  laterButton: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  laterButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontFamily: font.MonolithRegular

  },
});

export default AppUpdateModal;
