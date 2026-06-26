import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import VersionCheck from "react-native-version-check";
import strings from "../localization/Localization";
import font from "../theme/font";
import imageIndex from "../assets/imageIndex";
import colors from "../theme/colors";
import shadows from "../theme/shadows";

const IOS_APP_ID = "6777900970";
const IOS_BUNDLE_ID = "com.daina.app";
const IOS_STORE_URL = `https://apps.apple.com/in/app/daina/id${IOS_APP_ID}`;
const ENABLE_UPDATE_CHECK_IN_DEV = false;
const DEBUG_FORCE_SHOW = false;

const cleanVersion = (version: string) => version.replace(/[^0-9.]/g, "");

const isValidVersion = (version?: string) => {
  const cleaned = cleanVersion(version || "");
  return Boolean(cleaned && /\d/.test(cleaned) && cleaned !== "0.0.0");
};

const isVersionNewer = (current: string, latest: string) => {
  if (!isValidVersion(current) || !isValidVersion(latest)) return false;

  const currentParts = cleanVersion(current).split(".").map(Number);
  const latestParts = cleanVersion(latest).split(".").map(Number);
  const length = Math.max(currentParts.length, latestParts.length);

  for (let index = 0; index < length; index += 1) {
    const currentPart = currentParts[index] || 0;
    const latestPart = latestParts[index] || 0;

    if (latestPart > currentPart) return true;
    if (currentPart > latestPart) return false;
  }

  return false;
};

const fetchAppStoreVersion = async () => {
  const response = await fetch(
    `https://itunes.apple.com/lookup?id=${IOS_APP_ID}&country=in&timestamp=${Date.now()}`,
  );

  if (!response.ok) return null;

  const data = await response.json();
  const app = data?.results?.[0];

  if (!app?.version || app?.bundleId !== IOS_BUNDLE_ID) return null;

  return {
    latestVersion: cleanVersion(String(app.version)),
    storeUrl: app.trackViewUrl || IOS_STORE_URL,
  };
};

const AppUpdateModal = () => {
  const [visible, setVisible] = useState(false);
  const [storeUrl, setStoreUrl] = useState(IOS_STORE_URL);
  const [loading, setLoading] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");
  const [currentVersion, setCurrentVersion] = useState("");

  const showUpdateModal = useCallback((current: string, latest: string, url: string) => {
    setCurrentVersion(current);
    setLatestVersion(latest);
    setStoreUrl(url || IOS_STORE_URL);
    setVisible(true);
  }, []);

  const checkAppVersion = useCallback(async () => {
    if (Platform.OS !== "ios") return;
    if (__DEV__ && !ENABLE_UPDATE_CHECK_IN_DEV && !DEBUG_FORCE_SHOW) return;

    if (DEBUG_FORCE_SHOW) {
      showUpdateModal("1.0.0", "2.0.0", IOS_STORE_URL);
      return;
    }

    try {
      const localVersion = cleanVersion(VersionCheck.getCurrentVersion() || "");
      setCurrentVersion(localVersion);

      if (!isValidVersion(localVersion)) return;

      let updateNeeded = false;
      let fetchedLatestVersion = "";
      let fetchedStoreUrl = IOS_STORE_URL;

      try {
        const updateInfo = await VersionCheck.needUpdate({
          provider: "appStore",
          appID: IOS_APP_ID,
        });

        if (updateInfo?.latestVersion) {
          fetchedLatestVersion = cleanVersion(updateInfo.latestVersion);
          fetchedStoreUrl = updateInfo.storeUrl || IOS_STORE_URL;
          updateNeeded = Boolean(updateInfo.isNeeded) && isVersionNewer(localVersion, fetchedLatestVersion);
        }
      } catch (error) {
        console.warn("[AppUpdateModal] VersionCheck failed, using App Store fallback:", error);
      }

      if (!updateNeeded) {
        const fallbackInfo = await fetchAppStoreVersion();

        if (fallbackInfo) {
          fetchedLatestVersion = fallbackInfo.latestVersion;
          fetchedStoreUrl = fallbackInfo.storeUrl;
          updateNeeded = isVersionNewer(localVersion, fetchedLatestVersion);
        }
      }

      if (__DEV__) {
        console.log("[AppUpdateModal] Version check", {
          currentVersion: localVersion,
          latestVersion: fetchedLatestVersion,
          updateNeeded,
        });
      }

      if (updateNeeded && isValidVersion(fetchedLatestVersion)) {
        showUpdateModal(localVersion, fetchedLatestVersion, fetchedStoreUrl);
      } else {
        setVisible(false);
      }
    } catch (error) {
      console.warn("[AppUpdateModal] Version check failed:", error);
    }
  }, [showUpdateModal]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void checkAppVersion();
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkAppVersion]);

  const openStore = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const urlToOpen = storeUrl.startsWith("itms-apps://")
        ? storeUrl.replace("itms-apps://", "https://")
        : storeUrl || IOS_STORE_URL;

      await Linking.openURL(urlToOpen);
    } catch (error) {
      console.warn("[AppUpdateModal] Open store failed, trying fallback:", error);

      try {
        await Linking.openURL(IOS_STORE_URL);
      } catch (fallbackError) {
        console.warn("[AppUpdateModal] Fallback store URL failed:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.card}>
            <View style={styles.accentBar} />

            <TouchableOpacity style={styles.closeButton} activeOpacity={0.8} onPress={() => setVisible(false)}>
              <Text style={styles.closeButtonText}>x</Text>
            </TouchableOpacity>

            <Image
              source={imageIndex.phonLogoapp}
              style={styles.logo}
              resizeMode="contain"
            />


            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>
                {strings.formatString
                  ? String(
                    strings.formatString(
                      strings.VersionUpdateText || "Current {0} - Latest {1}",
                      currentVersion || "1.0.0",
                      latestVersion || "1.0.0",
                    ),
                  )
                  : `Current ${currentVersion || "1.0.0"} - Latest ${latestVersion || "1.0.0"}`}
              </Text>
            </View>

            <Text style={styles.message}>
              {strings.UpdateAvailableMessage ||
                "A newer, faster, and more stable version of Daina is ready. Update now to get the latest features and improvements."}
            </Text>

            <TouchableOpacity
              style={[styles.updateButton, loading && styles.updateButtonDisabled]}
              onPress={openStore}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#111827" size="small" />
              ) : (
                <Text style={styles.updateButtonText}>{strings.UpdateNow || "Update Now"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.68)",
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 26,
    overflow: "hidden",
    ...shadows.modal,
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: colors.primary,
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
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
    fontFamily: font.MonolithRegular,

  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.textPrimary,
    borderWidth: 3,
    borderColor: colors.primary,
    marginBottom: 18,
  },
  iconText: {
    color: colors.primary,
    fontSize: 34,
    lineHeight: 36,
    fontFamily: font.MonolithRegular,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: font.MonolithRegular,
    textAlign: "center",
  },
  versionBadge: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  versionText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: font.MonolithRegular,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 16,
    textAlign: "center",
    fontFamily: font.MonolithRegular,
  },
  updateButton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginTop: 24,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: font.MonolithRegular,
  },
  logo: { height: 96, width: 167 },

});

export default AppUpdateModal;
