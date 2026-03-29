import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { API_BASE_URLS } from "@/config/constants";

const unwrap = (response: any) => response.data ?? response;

export const venueApi = createApi({
  reducerPath: "venueApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URLS.VENUE,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "Venue",
    "Venues",
    "Booking",
    "Vendor",
    "Vendors",
    "Contract",
    "VendorExpense",
  ],
  endpoints: (builder) => ({
    createVenue: builder.mutation<any, any>({
      query: (body) => ({ url: "/venues", method: "POST", body }),
      transformResponse: unwrap,
      invalidatesTags: ["Venues"],
    }),
    listVenues: builder.query<any, Record<string, any> | void>({
      query: (params) => ({ url: "/venues", params: params || {} }),
      transformResponse: unwrap,
      providesTags: ["Venues"],
    }),
    getVenue: builder.query<any, string>({
      query: (id) => `/venues/${id}`,
      transformResponse: unwrap,
      providesTags: (_r, _e, id) => [{ type: "Venue", id }],
    }),
    updateVenue: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/venues/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Venue", id }, "Venues"],
    }),
    deleteVenue: builder.mutation<any, string>({
      query: (id) => ({ url: `/venues/${id}`, method: "DELETE" }),
      transformResponse: unwrap,
      invalidatesTags: ["Venues"],
    }),
    getVenueAvailability: builder.query<any, string>({
      query: (id) => `/venues/${id}/availability`,
      transformResponse: unwrap,
    }),
    bookVenue: builder.mutation<any, { venueId: string; data: any }>({
      query: ({ venueId, data }) => ({
        url: `/venues/${venueId}/book`,
        method: "POST",
        body: data,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Booking", "Venues"],
    }),
    listBookings: builder.query<any, void>({
      query: () => "/venues/bookings",
      transformResponse: unwrap,
      providesTags: ["Booking"],
    }),
    getEventBookings: builder.query<any, string>({
      query: (eventId) => `/venues/bookings?event_id=${eventId}`,
      transformResponse: unwrap,
      providesTags: (_r, _e, eventId) => [{ type: "Booking", id: eventId }],
    }),
    // Vendors
    listVendors: builder.query<any, Record<string, any> | void>({
      query: (params) => ({ url: "/vendors", params: params || {} }),
      transformResponse: unwrap,
      providesTags: ["Vendors"],
    }),
    createVendor: builder.mutation<any, any>({
      query: (body) => ({ url: "/vendors", method: "POST", body }),
      transformResponse: unwrap,
      invalidatesTags: ["Vendors"],
    }),
    submitVendorReview: builder.mutation<
      any,
      { vendorId: string; data: any }
    >({
      query: ({ vendorId, data }) => ({
        url: `/vendors/${vendorId}/reviews`,
        method: "POST",
        body: data,
      }),
      transformResponse: unwrap,
    }),
    hireVendor: builder.mutation<any, { eventId: string; data: any }>({
      query: ({ eventId, data }) => ({
        url: `/contracts/event/${eventId}`,
        method: "POST",
        body: data,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Contract"],
    }),
    getEventContracts: builder.query<any, string>({
      query: (eventId) => `/contracts/event/${eventId}`,
      transformResponse: unwrap,
      providesTags: ["Contract"],
    }),
    updateContractStatus: builder.mutation<
      any,
      { contractId: string; status: string }
    >({
      query: ({ contractId, ...body }) => ({
        url: `/contracts/${contractId}/status`,
        method: "PATCH",
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Contract"],
    }),
    submitVendorExpense: builder.mutation<
      any,
      { eventId: string; data: any }
    >({
      query: ({ eventId, data }) => ({
        url: `/contracts/event/${eventId}/expenses`,
        method: "POST",
        body: data,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["VendorExpense"],
    }),
    getVendorExpenses: builder.query<any, string>({
      query: (eventId) => `/contracts/event/${eventId}/expenses`,
      transformResponse: unwrap,
      providesTags: ["VendorExpense"],
    }),
    updateVendorExpenseStatus: builder.mutation<
      any,
      { expenseId: string; status: string }
    >({
      query: ({ expenseId, ...body }) => ({
        url: `/vendor-expenses/${expenseId}/status`,
        method: "PATCH",
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["VendorExpense"],
    }),
  }),
});

export const {
  useCreateVenueMutation,
  useListVenuesQuery,
  useGetVenueQuery,
  useUpdateVenueMutation,
  useDeleteVenueMutation,
  useGetVenueAvailabilityQuery,
  useBookVenueMutation,
  useListBookingsQuery,
  useGetEventBookingsQuery,
  useListVendorsQuery,
  useCreateVendorMutation,
  useSubmitVendorReviewMutation,
  useHireVendorMutation,
  useGetEventContractsQuery,
  useUpdateContractStatusMutation,
  useSubmitVendorExpenseMutation,
  useGetVendorExpensesQuery,
  useUpdateVendorExpenseStatusMutation,
} = venueApi;
