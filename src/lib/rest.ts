import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';

const CHANNEL_ID = 'rest';

let handlerInstalled = false;
let permissionAsked = false;
let permissionGranted = false;

/**
 * Local notifications only — this app never talks to a push service. Every call
 * is best-effort: if notifications are unavailable (permissions denied, Expo Go
 * quirk), the in-app countdown and vibration still work.
 */
export function configureRestNotifications() {
  if (handlerInstalled) return;
  handlerInstalled = true;
  try {
    (Notifications as any).setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Not fatal — foreground banner is a nicety.
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (permissionGranted) return true;
  if (permissionAsked) return permissionGranted;
  permissionAsked = true;
  try {
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    permissionGranted = status === 'granted';
    if (permissionGranted && Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Rest timer',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 350, 150, 350],
        enableVibrate: true,
      });
    }
  } catch {
    permissionGranted = false;
  }
  return permissionGranted;
}

/** Schedules the "rest over" alert; returns its id so it can be cancelled. */
export async function scheduleRestDone(seconds: number, label: string): Promise<string | null> {
  const ok = await ensureNotificationPermission();
  if (!ok) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rest over',
        body: label,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      } as any,
      trigger: {
        type: 'timeInterval',
        seconds: Math.max(1, Math.round(seconds)),
        repeats: false,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      } as any,
    });
  } catch {
    return null;
  }
}

export async function cancelRestDone(id: string | null | undefined) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Already fired or not scheduled — nothing to do.
  }
}

export async function cancelAllRestNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}

/** Short tap for a logged set, longer buzz when rest finishes. */
export function tickFeedback() {
  Vibration.vibrate(25);
}

export function restDoneFeedback() {
  Vibration.vibrate([0, 350, 150, 350]);
}
