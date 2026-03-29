import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { API_BASE_URLS } from "@/config/constants";

const unwrap = (response: any) => response.data ?? response;

export const eventApi = createApi({
  reducerPath: "eventApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URLS.EVENT,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Event", "Events", "Session", "Agenda", "Categories"],
  endpoints: (builder) => ({
    createEvent: builder.mutation<any, any>({
      query: (body) => ({ url: "/events", method: "POST", body }),
      transformResponse: unwrap,
      invalidatesTags: ["Events"],
    }),
    listEvents: builder.query<any, Record<string, any> | void>({
      query: (params) => ({ url: "/events", params: params || {} }),
      transformResponse: (response: any) => ({
        content: response.data ?? response,
        meta: response.meta,
      }),
      providesTags: ["Events"],
    }),
    getEvent: builder.query<any, string>({
      query: (id) => `/events/${id}`,
      transformResponse: unwrap,
      providesTags: (_r, _e, id) => [{ type: "Event", id }],
    }),
    updateEvent: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/events/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Event", id },
        "Events",
      ],
    }),
    updateEventStatus: builder.mutation<
      any,
      { id: string; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/events/${id}/status?status=${status}`,
        method: "PATCH",
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Event", id },
        "Events",
      ],
    }),
    deleteEvent: builder.mutation<any, string>({
      query: (id) => ({ url: `/events/${id}`, method: "DELETE" }),
      transformResponse: unwrap,
      invalidatesTags: ["Events"],
    }),
    // Sessions
    addSession: builder.mutation<any, { eventId: string; data: any }>({
      query: ({ eventId, data }) => ({
        url: `/events/${eventId}/sessions`,
        method: "POST",
        body: data,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "Agenda", id: eventId },
      ],
    }),
    updateSession: builder.mutation<
      any,
      { eventId: string; sessionId: string; data: any }
    >({
      query: ({ eventId, sessionId, data }) => ({
        url: `/events/${eventId}/sessions/${sessionId}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "Agenda", id: eventId },
      ],
    }),
    deleteSession: builder.mutation<
      any,
      { eventId: string; sessionId: string }
    >({
      query: ({ eventId, sessionId }) => ({
        url: `/events/${eventId}/sessions/${sessionId}`,
        method: "DELETE",
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "Agenda", id: eventId },
      ],
    }),
    getAgenda: builder.query<any, string>({
      query: (eventId) => `/events/${eventId}/agenda`,
      transformResponse: unwrap,
      providesTags: (_r, _e, eventId) => [{ type: "Agenda", id: eventId }],
    }),
    reorderAgenda: builder.mutation<any, { eventId: string; order: any[] }>({
      query: ({ eventId, order }) => ({
        url: `/events/${eventId}/agenda/reorder`,
        method: "PUT",
        body: order,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "Agenda", id: eventId },
      ],
    }),
    validateAgenda: builder.mutation<any, string>({
      query: (eventId) => ({
        url: `/events/${eventId}/agenda/validate`,
        method: "POST",
      }),
      transformResponse: unwrap,
    }),
    searchEvents: builder.query<any, string>({
      query: (q) => ({ url: "/events/search", params: { q } }),
      transformResponse: unwrap,
    }),
    getCategories: builder.query<any, void>({
      query: () => "/categories",
      transformResponse: unwrap,
      providesTags: ["Categories"],
    }),
  }),
});

export const {
  useCreateEventMutation,
  useListEventsQuery,
  useGetEventQuery,
  useUpdateEventMutation,
  useUpdateEventStatusMutation,
  useDeleteEventMutation,
  useAddSessionMutation,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
  useGetAgendaQuery,
  useReorderAgendaMutation,
  useValidateAgendaMutation,
  useSearchEventsQuery,
  useGetCategoriesQuery,
} = eventApi;
