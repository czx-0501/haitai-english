/**
 * Capacitor 原生功能集成
 */
export function isNative(): boolean {
  return !!(window as any).Capacitor?.isNativePlatform();
}

export async function initNativeFeatures(): Promise<void> {
  if (!isNative()) return;

  try {
    // StatusBar
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: '#f8fafc' });

    // Schedule daily learning reminder
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const hasPerm = await LocalNotifications.checkPermissions();
    if (hasPerm.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
    const now = new Date();
    const triggerAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
    if (triggerAt <= now) triggerAt.setDate(triggerAt.getDate() + 1);
    await LocalNotifications.schedule({
      notifications: [{
        title: '海苔英语',
        body: '今天的学习任务还未完成，快来打卡吧！',
        id: 1,
        schedule: {
          at: triggerAt,
          repeats: true, every: "day"
        },
        sound: 'default',
        attachments: [],
        actionTypeId: ''
      }]
    });
  } catch (e) {
    // Silently fail if capacitor not available
  }
}

export async function shareContent(text: string): Promise<void> {
  if (!isNative()) return;
  try {
    const { Share } = await import('@capacitor/share');
    await Share.share({ text });
  } catch {}
}

export async function hapticsLight(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
}

export async function hapticsSuccess(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Success });
  } catch {}
}
