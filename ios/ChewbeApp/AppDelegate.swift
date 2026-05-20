import UIKit
import React
import React_RCTAppDelegate
import Firebase
import FirebaseMessaging
import UserNotifications
import GoogleMaps
import AVFoundation

@main
class AppDelegate: RCTAppDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    NSLog("🚀 AppDelegate: application didFinishLaunchingWithOptions started")
    
    // ✅ Setup AVAudioSession for notification sounds
    do {
      try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers, .duckOthers])
      try AVAudioSession.sharedInstance().setActive(true)
    } catch {
      NSLog("❌ AppDelegate: Failed to set AVAudioSession category: \(error)")
    }


    // ✅ Initialize Google Maps
    GMSServices.provideAPIKey("YCsdio8xRsUmoYht2WQ9jeRvF4U_tT4")

    // ✅ Configure Firebase (Manual initialization as fallback for missing plist bundle resource)
    if FirebaseApp.app() == nil {
        let options = FirebaseOptions(googleAppID: "1:145218387085:ios:ca98454e86dd16a07336c4",
                                     gcmSenderID: "145218387085")
        options.apiKey = "AIzaSyB-YCsdio8xRsUmoYht2WQ9jeRvF4U_tT4"
        options.projectID = "daina-3275f"
        options.storageBucket = "daina-3275f.firebasestorage.app"
        options.bundleID = "com.DainaAppIOS"
        FirebaseApp.configure(options: options)
        NSLog("✅ AppDelegate: Firebase manual configuration applied successfully.")
    } else {
        NSLog("ℹ️ AppDelegate: Firebase already configured.")
    }

    // ✅ Push Notification Setup
    UNUserNotificationCenter.current().delegate = self
    Messaging.messaging().delegate = self
    application.registerForRemoteNotifications()

    self.moduleName = "ChewbeApp"
    self.initialProps = [:]

    NSLog("🏁 AppDelegate: Calling super.application")
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  @objc override func application(_ application: UIApplication,
                            didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
    NSLog("✅ AppDelegate: APNs token set successfully.")
  }

  @objc override func application(_ application: UIApplication,
                            didFailToRegisterForRemoteNotificationsWithError error: Error) {
    NSLog("❌ AppDelegate: APNs registration failed: (error.localizedDescription)")
  }

  // ✅ MessagingDelegate
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    NSLog("✅ AppDelegate: FCM Token received: \(fcmToken ?? "none")")
  }

  // ✅ Foreground notification
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                               willPresent notification: UNNotification,
                               withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.banner, .sound, .badge])
  }

  // ✅ Notification tap
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                               didReceive response: UNNotificationResponse,
                               withCompletionHandler completionHandler: @escaping () -> Void) {
    completionHandler()
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
