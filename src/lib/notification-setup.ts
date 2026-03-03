/**
 * App initialization for notifications and permissions.
 * Call this once on app startup.
 */
import { requestNotificationPermission, isNativePlatform } from "./native-plugins";

let initialized = false;

export async function initializeAppPermissions() {
  if (initialized) return;
  initialized = true;

  // Request notification permission early
  const granted = await requestNotificationPermission();
  console.log("Notification permission:", granted ? "granted" : "denied");

  // On native, we can also register for push notifications later
  if (isNativePlatform()) {
    console.log("Running as native app - all native features available");
  }
}
