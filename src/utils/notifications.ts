// 本地通知存储（适用于提醒、成就等）
const STORAGE_KEY = 'engdaily_notifications';
const MAX_ITEMS = 50;

export type NotificationType = 'learning_complete' | 'quiz_complete' | 'streak_milestone' | 'vocab_milestone' | 'friend_request' | 'system';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export function getNotifications(): NotificationItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

export function addNotification(type: NotificationType, title: string, message: string): void {
  try {
    const list = getNotifications();
    list.unshift({ id: Date.now().toString() + Math.random().toString(36).slice(2, 6), type, title, message, timestamp: Date.now(), read: false });
    if (list.length > MAX_ITEMS) list.length = MAX_ITEMS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export function markAsRead(id: string): void {
  try {
    const list = getNotifications();
    const n = list.find(item => item.id === id);
    if (n) n.read = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export function markAllAsRead(): void {
  try {
    const list = getNotifications();
    list.forEach(n => n.read = true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export function getUnreadCount(): number {
  return getNotifications().filter(n => !n.read).length;
}

// 检查并触发里程碑通知
export function checkAchievements(streak: number, totalLearned: number): void {
  const milestones = [7, 30, 100, 365];
  if (milestones.includes(streak)) {
    addNotification('streak_milestone', `🔥 连续学习 ${streak} 天`, `恭喜达成连续学习 ${streak} 天里程碑！继续坚持！`);
  }
  const vocabMilestones = [100, 500, 1000, 2000, 5000];
  for (const v of vocabMilestones) {
    if (totalLearned >= v && !hasNotificationTypeValue('vocab_milestone', v)) {
      addNotification('vocab_milestone', `📚 已学 ${v} 个单词`, `恭喜词汇量突破 ${v} 词！`);
      break;
    }
  }
}

function hasNotificationTypeValue(type: string, value: number): boolean {
  return getNotifications().some(n => n.type === type && n.message.includes(String(value)));
}
