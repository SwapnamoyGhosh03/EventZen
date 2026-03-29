import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { API_BASE_URLS } from "@/config/constants";

const unwrap = (response: any) => response.data ?? response;

export interface ReviewPayload {
  eventId: string;
  organizerId?: string;
  eventRating: number;
  vendorRating: number;
  platformRating: number;
  eventComment?: string;
  vendorComment?: string;
  platformComment?: string;
}

export const reviewApi = createApi({
  reducerPath: "reviewApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URLS.TICKET,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Review", "ReviewSummary"],
  endpoints: (builder) => ({
    submitReview: builder.mutation<any, ReviewPayload>({
      query: ({ eventId, ...body }) => ({
        url: `/events/${eventId}/feedback`,
        method: "POST",
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "ReviewSummary", id: eventId },
        { type: "Review", id: eventId },
        "Review",
      ],
    }),
    getEventReviews: builder.query<any, string>({
      query: (eventId) => `/events/${eventId}/feedback`,
      transformResponse: unwrap,
      providesTags: (_r, _e, eventId) => [{ type: "Review", id: eventId }],
    }),
    getReviewSummary: builder.query<any, string>({
      query: (eventId) => `/events/${eventId}/feedback/summary`,
      transformResponse: unwrap,
      providesTags: (_r, _e, eventId) => [{ type: "ReviewSummary", id: eventId }],
    }),
    getMyReviews: builder.query<any, void>({
      query: () => "/feedback/me",
      transformResponse: unwrap,
      providesTags: ["Review"],
    }),
    getEventReviewsList: builder.query<any, string>({
      query: (eventId) => `/events/${eventId}/feedback/reviews`,
      transformResponse: unwrap,
      providesTags: (_r, _e, eventId) => [{ type: "Review", id: `${eventId}-list` }],
    }),
    getPublicReviews: builder.query<any, string>({
      query: (eventId) => `/events/${eventId}/feedback/public`,
      transformResponse: unwrap,
      providesTags: (_r, _e, eventId) => [{ type: "Review", id: `${eventId}-public` }],
    }),
    getBulkSummaries: builder.query<any, string[]>({
      query: (eventIds) => ({
        url: "/feedback/bulk-summary",
        method: "POST",
        body: eventIds,
      }),
      transformResponse: unwrap,
      providesTags: ["ReviewSummary"],
    }),
    toggleShowcase: builder.mutation<any, { eventId: string; feedbackId: string; showcase: boolean }>({
      query: ({ eventId, feedbackId, showcase }) => ({
        url: `/events/${eventId}/feedback/${feedbackId}/showcase`,
        method: "PATCH",
        body: { showcase },
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "Review", id: `${eventId}-list` },
        { type: "Review", id: `${eventId}-public` },
        { type: "ReviewSummary", id: eventId },
      ],
    }),
  }),
});

export const {
  useSubmitReviewMutation,
  useGetEventReviewsQuery,
  useGetReviewSummaryQuery,
  useGetMyReviewsQuery,
  useGetEventReviewsListQuery,
  useGetPublicReviewsQuery,
  useGetBulkSummariesQuery,
  useToggleShowcaseMutation,
} = reviewApi;
