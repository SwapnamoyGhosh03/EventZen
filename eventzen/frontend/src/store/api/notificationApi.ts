import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { API_BASE_URLS } from "@/config/constants";

export interface Notification {
  notification_id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  channel: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "READ";
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
  expires_at: string | null;
  deleted: boolean;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URLS.NOTIFICATION,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Notification", "UnreadCount"],
  endpoints: (builder) => ({
    getNotifications: builder.query<
      NotificationListResponse,
      { page?: number; limit?: number; status?: string }
    >({
      query: ({ page = 1, limit = 50, status } = {}) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (status) params.set("status", status);
        return `/notifications?${params}`;
      },
      providesTags: ["Notification"],
      keepUnusedDataFor: 0,
    }),
    getUnreadCount: builder.query<{ success: boolean; data: { count: number } }, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["UnreadCount"],
    }),
    markAsRead: builder.mutation<{ success: boolean; data: Notification }, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notification", "UnreadCount"],
    }),
    markAllAsRead: builder.mutation<{ success: boolean; data: { markedCount: number } }, void>({
      query: () => ({ url: "/notifications/mark-all-read", method: "PATCH" }),
      invalidatesTags: ["Notification", "UnreadCount"],
    }),
    deleteNotification: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notification", "UnreadCount"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;
