import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { API_BASE_URLS } from "@/config/constants";

const unwrap = (response: any) => response.data ?? response;

export const paymentApi = createApi({
  reducerPath: "paymentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URLS.PAYMENT,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Budget", "Expense", "Payment", "FinancialReport", "Sponsorship", "AdminRevenue"],
  endpoints: (builder) => ({
    createBudget: builder.mutation<any, { eventId: string; data: any }>({
      query: ({ eventId, data }) => ({
        url: `/events/${eventId}/budget`,
        method: "POST",
        body: data,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Budget", "AdminRevenue"],
    }),
    getBudget: builder.query<any, string>({
      query: (eventId) => `/events/${eventId}/budget`,
      transformResponse: unwrap,
      providesTags: (_r, _e, eventId) => [{ type: "Budget", id: eventId }],
      keepUnusedDataFor: 0,
    }),
    approveBudget: builder.mutation<any, string>({
      query: (id) => ({
        url: `/budgets/${id}/approve`,
        method: "PUT",
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Budget", "AdminRevenue"],
    }),
    addBudgetItem: builder.mutation<any, { budgetId: string; data: any }>({
      query: ({ budgetId, data }) => ({
        url: `/budgets/${budgetId}/items`,
        method: "POST",
        body: data,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Budget"],
    }),
    logExpense: builder.mutation<any, any>({
      query: (body) => ({ url: "/expenses", method: "POST", body }),
      transformResponse: unwrap,
      invalidatesTags: ["Expense", "Budget"],
    }),
    makePayment: builder.mutation<any, any>({
      query: (body) => ({ url: "/payments", method: "POST", body }),
      transformResponse: unwrap,
      invalidatesTags: ["Payment", "AdminRevenue"],
    }),
    verifyPayment: builder.mutation<any, any>({
      query: (body) => ({
        url: "/payments/verify",
        method: "POST",
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Payment"],
    }),
    getFinancialReport: builder.query<any, string>({
      query: (eventId) => `/events/${eventId}/reports/financial`,
      transformResponse: unwrap,
      providesTags: ["FinancialReport"],
      keepUnusedDataFor: 0,
    }),
    addSponsorship: builder.mutation<any, { eventId: string; data: any }>({
      query: ({ eventId, data }) => ({
        url: `/events/${eventId}/sponsorships`,
        method: "POST",
        body: data,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Sponsorship"],
    }),
    getSponsorships: builder.query<any, string>({
      query: (eventId) => `/events/${eventId}/sponsorships`,
      transformResponse: unwrap,
      providesTags: (_r, _e, eventId) => [{ type: "Sponsorship", id: eventId }],
    }),
    getAdminRevenue: builder.query<any, void>({
      query: () => "/admin/revenue",
      transformResponse: unwrap,
      providesTags: ["AdminRevenue"],
      keepUnusedDataFor: 0,
    }),
    autoVenueExpense: builder.mutation<any, { eventId: string; bookingId: string; amount: number; currency?: string }>({
      query: (body) => ({ url: "/expenses/venue-auto", method: "POST", body }),
      transformResponse: unwrap,
      invalidatesTags: ["Expense", "Budget", "FinancialReport"],
    }),
  }),
});

export const {
  useCreateBudgetMutation,
  useGetBudgetQuery,
  useApproveBudgetMutation,
  useAddBudgetItemMutation,
  useLogExpenseMutation,
  useMakePaymentMutation,
  useVerifyPaymentMutation,
  useGetFinancialReportQuery,
  useAddSponsorshipMutation,
  useGetSponsorshipsQuery,
  useGetAdminRevenueQuery,
  useAutoVenueExpenseMutation,
} = paymentApi;
