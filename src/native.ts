// Native extras when running inside the iOS app (Capacitor). Everything here is a no-op on the web.

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import type { GameEvent } from './game/types';

export const isNative = Capacitor.isNativePlatform();

/** A short buzz for game moments. */
export function hapticFor(event: GameEvent): void {
  if (!isNative) return;
  switch (event.type) {
    case 'spawn':
      void Haptics.impact({ style: ImpactStyle.Light });
      break;
    case 'merge':
    case 'upgraded':
      void Haptics.impact({ style: ImpactStyle.Medium });
      break;
    case 'deliver':
    case 'payday':
    case 'bought':
    case 'vested':
      void Haptics.notification({ type: NotificationType.Success });
      break;
    case 'denied':
    case 'paged':
    case 'burnout':
      void Haptics.notification({ type: NotificationType.Warning });
      break;
  }
}

/**
 * iOS can clear a web view's localStorage when the device is low on space, so the native app
 * also keeps the save in Preferences (UserDefaults). localStorage stays the fast, synchronous copy.
 */
export async function backupSave(key: string, value: string): Promise<void> {
  if (isNative) await Preferences.set({ key, value });
}

export async function restoreSave(key: string): Promise<string | null> {
  if (!isNative) return null;
  return (await Preferences.get({ key })).value;
}
