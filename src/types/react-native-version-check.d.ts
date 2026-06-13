declare module "react-native-version-check" {
  type NeedUpdateOptions = {
    provider?: "appStore" | "playStore";
    appID?: string;
    packageName?: string;
  };

  type NeedUpdateResult = {
    isNeeded?: boolean;
    latestVersion?: string;
    storeUrl?: string;
  };

  const VersionCheck: {
    getCurrentVersion: () => string;
    needUpdate: (options?: NeedUpdateOptions) => Promise<NeedUpdateResult>;
  };

  export default VersionCheck;
}
