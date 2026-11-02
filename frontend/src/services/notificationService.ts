import api from "./api";

export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const response = await api.get<AppNotification[]>("/api/notifications");
  return response.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await api.get<number>(
    "/api/notifications/unread-count"
  );
  return response.data;
}

export async function markNotificationAsRead(
  id: number
): Promise<AppNotification> {
  const response = await api.patch<AppNotification>(
    `/api/notifications/${id}/read`
  );
  return response.data;
}

export async function markAllNotificationsAsRead(): Promise<AppNotification[]> {
  const response = await api.patch<AppNotification[]>(
    "/api/notifications/read-all"
  );
  return response.data;
}