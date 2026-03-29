import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { API_BASE_URLS } from "@/config/constants";
import { logout, setToken } from "@/store/slices/authSlice";

const unwrap = (response: any) => response.data ?? response;

const ticketBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URLS.TICKET,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const authRefreshBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URLS.AUTH,
  credentials: "include",
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await ticketBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await authRefreshBaseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions
    );

    const refreshedToken =
      (refreshResult.data as any)?.data?.accessToken ||
      (refreshResult.data as any)?.accessToken;

    if (refreshedToken) {
      api.dispatch(setToken(refreshedToken));
      result = await ticketBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const ticketApi = createApi({
  reducerPath: "ticketApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "TicketTypes",
    "TicketType",
    "Registration",
    "Registrations",
    "Ticket",
    "Tickets",
    "CheckIn",
    "Feedback",
  ],
  endpoints: (builder) => ({
    getTicketTypes: builder.query<any, string>({
      query: (eventId) => ({ url: "/ticket-types", params: { eventId } }),
      transformResponse: unwrap,
      providesTags: (_r, _e, eventId) => [
        { type: "TicketTypes", id: eventId },
      ],
    }),
    createTicketType: builder.mutation<
      any,
      { eventId: string; data: any }
    >({
      query: ({ eventId, data }) => ({
        url: `/events/${eventId}/ticket-types`,
        method: "POST",
        body: data,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "TicketTypes", id: eventId },
      ],
    }),
    updateTicketType: builder.mutation<
      any,
      { ticketTypeId: string; eventId: string; data: any }
    >({
      query: ({ ticketTypeId, data }) => ({
        url: `/ticket-types/${ticketTypeId}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "TicketTypes", id: eventId },
      ],
    }),
    deleteTicketType: builder.mutation<
      any,
      { ticketTypeId: string; eventId: string }
    >({
      query: ({ ticketTypeId }) => ({
        url: `/ticket-types/${ticketTypeId}`,
        method: "DELETE",
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "TicketTypes", id: eventId },
      ],
    }),
    register: builder.mutation<any, { data: any; idempotencyKey: string }>({
      query: ({ data, idempotencyKey }) => ({
        url: "/registrations",
        method: "POST",
        body: data,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Registrations", "Tickets"],
    }),
    getMyRegistrations: builder.query<any, void>({
      query: () => "/registrations/me",
      transformResponse: unwrap,
      providesTags: ["Registrations"],
    }),
    getEventRegistrations: builder.query<
      any,
      { eventId: string; page?: number; size?: number }
    >({
      query: ({ eventId, ...params }) => ({
        url: `/events/${eventId}/registrations`,
        params,
      }),
      transformResponse: unwrap,
      providesTags: ["Registrations"],
    }),
    cancelRegistration: builder.mutation<any, string>({
      query: (id) => ({ url: `/registrations/${id}`, method: "DELETE" }),
      transformResponse: unwrap,
      invalidatesTags: ["Registrations", "Tickets"],
    }),
    getTicket: builder.query<any, string>({
      query: (id) => `/tickets/${id}`,
      transformResponse: unwrap,
      providesTags: (_r, _e, id) => [{ type: "Ticket", id }],
    }),
    getMyTickets: builder.query<any, void>({
      query: () => "/tickets/me",
      transformResponse: unwrap,
      providesTags: ["Tickets"],
    }),
    scanCheckIn: builder.mutation<any, { qrCodeData: string; eventId?: string }>({
      query: ({ qrCodeData, eventId }) => ({
        url: "/checkin/scan",
        method: "POST",
        body: { qrCodeData, ...(eventId ? { eventId } : {}) },
      }),
      transformResponse: unwrap,
      invalidatesTags: ["CheckIn"],
    }),
    getCheckInStats: builder.query<any, string>({
      query: (eventId) => `/events/${eventId}/checkin/stats`,
      transformResponse: unwrap,
      providesTags: (_r, _e, eventId) => [{ type: "CheckIn", id: eventId }],
    }),
    submitFeedback: builder.mutation<
      any,
      { eventId: string; data: any }
    >({
      query: ({ eventId, data }) => ({
        url: `/events/${eventId}/feedback`,
        method: "POST",
        body: data,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "Feedback", id: eventId },
      ],
    }),
    getFeedback: builder.query<any, string>({
      query: (eventId) => `/events/${eventId}/feedback`,
      transformResponse: unwrap,
      providesTags: (_r, _e, eventId) => [
        { type: "Feedback", id: eventId },
      ],
    }),
    getFeedbackSummary: builder.query<any, string>({
      query: (eventId) => `/events/${eventId}/feedback/summary`,
      transformResponse: unwrap,
    }),
    importAttendees: builder.mutation<any, { eventId: string; file: FormData }>(
      {
        query: ({ file }) => ({
          url: "/attendees/import",
          method: "POST",
          body: file,
        }),
        transformResponse: unwrap,
      }
    ),
  }),
});

export const {
  useGetTicketTypesQuery,
  useCreateTicketTypeMutation,
  useUpdateTicketTypeMutation,
  useDeleteTicketTypeMutation,
  useRegisterMutation,
  useGetMyRegistrationsQuery,
  useGetEventRegistrationsQuery,
  useCancelRegistrationMutation,
  useGetTicketQuery,
  useGetMyTicketsQuery,
  useScanCheckInMutation,
  useGetCheckInStatsQuery,
  useSubmitFeedbackMutation,
  useGetFeedbackQuery,
  useGetFeedbackSummaryQuery,
  useImportAttendeesMutation,
} = ticketApi;
