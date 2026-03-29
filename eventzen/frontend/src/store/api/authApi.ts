import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { API_BASE_URLS } from "@/config/constants";

const unwrap = (response: any) => response.data ?? response;
const normalizeRole = (role: string | undefined) =>
  (role || "CUSTOMER").replace(/^ROLE_/, "").toUpperCase();

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URLS.AUTH,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
    credentials: "include",
  }),
  tagTypes: ["User", "AccountRequest", "Users"],
  endpoints: (builder) => ({
    login: builder.mutation<
      { accessToken: string; user: any },
      { email: string; password: string }
    >({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (response: any) => {
        const firstRole = response.data.user.roles?.[0] || response.data.user.role;
        return {
          accessToken: response.data.accessToken,
          user: {
            id: response.data.user.userId,
            email: response.data.user.email,
            firstName: response.data.user.firstName,
            lastName: response.data.user.lastName,
            role: normalizeRole(firstRole),
          },
        };
      },
    }),
    register: builder.mutation<any, any>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: (response: any) => response.data || response,
    }),
    verifyOtp: builder.mutation<any, { email: string; otp: string }>({
      query: (body) => ({ url: "/auth/verify-otp", method: "POST", body }),
      transformResponse: (response: any) => response.data || response,
    }),
    resendOtp: builder.mutation<any, { email: string }>({
      query: (body) => ({ url: "/auth/resend-otp", method: "POST", body }),
      transformResponse: (response: any) => response.data || response,
    }),
    refreshToken: builder.mutation<{ accessToken: string }, void>({
      query: () => ({ url: "/auth/refresh", method: "POST" }),
      transformResponse: (response: any) => ({
        accessToken: response.data?.accessToken || response.accessToken,
      }),
    }),
    logoutUser: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    getMe: builder.query<any, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
      transformResponse: (response: any) => {
        const firstRole = response.data.roles?.[0] || response.data.role;
        return {
          id: response.data.userId,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          role: normalizeRole(firstRole),
          avatar: response.data.avatarUrl,
          emailVerified: response.data.isEmailVerified,
          mfaEnabled: response.data.isMfaEnabled,
        };
      },
    }),
    updateProfile: builder.mutation<any, any>({
      query: (body) => ({ url: "/auth/me/profile", method: "PATCH", body }),
      invalidatesTags: ["User"],
    }),
    forgotPassword: builder.mutation<any, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    resetPassword: builder.mutation<any, { token: string; password: string }>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),
    resendVerification: builder.mutation<any, void>({
      query: () => ({
        url: "/auth/email-verification/resend",
        method: "POST",
      }),
    }),
    confirmEmail: builder.mutation<any, { token: string }>({
      query: (body) => ({
        url: "/auth/email-verification/confirm",
        method: "POST",
        body,
      }),
    }),
    setupMfa: builder.mutation<any, void>({
      query: () => ({ url: "/auth/mfa/setup", method: "POST" }),
    }),
    verifyMfa: builder.mutation<any, { code: string }>({
      query: (body) => ({ url: "/auth/mfa/verify", method: "POST", body }),
    }),
    // Admin endpoints
    listUsers: builder.query<any, { page?: number; size?: number; role?: string; search?: string }>({
      query: (params) => ({
        url: "/users",
        params,
      }),
      providesTags: ["Users"],
    }),
    assignRole: builder.mutation<any, { id: string; roles: string[] }>({
      query: ({ id, ...body }) => ({
        url: `/users/${id}/roles`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    deactivateUser: builder.mutation<any, string>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),
    reactivateUser: builder.mutation<any, string>({
      query: (id) => ({
        url: `/users/${id}/reactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Users"],
    }),
    gdprDelete: builder.mutation<any, string>({
      query: (id) => ({
        url: `/users/${id}/gdpr/delete`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
    // Account requests
    submitAccountRequest: builder.mutation<any, any>({
      query: (body) => ({
        url: "/account-requests",
        method: "POST",
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["AccountRequest"],
    }),
    getMyRequests: builder.query<any, void>({
      query: () => "/account-requests/me",
      transformResponse: unwrap,
      providesTags: ["AccountRequest"],
    }),
    cancelRequest: builder.mutation<any, string>({
      query: (id) => ({
        url: `/account-requests/${id}`,
        method: "DELETE",
      }),
      transformResponse: unwrap,
      invalidatesTags: ["AccountRequest"],
    }),
    getAdminRequests: builder.query<any, void>({
      query: () => "/account-requests/admin",
      transformResponse: unwrap,
      providesTags: ["AccountRequest"],
    }),
    approveRequest: builder.mutation<any, string>({
      query: (id) => ({
        url: `/account-requests/admin/${id}/approve`,
        method: "PATCH",
      }),
      transformResponse: unwrap,
      invalidatesTags: ["AccountRequest"],
    }),
    rejectRequest: builder.mutation<any, { id: string; adminNotes?: string }>({
      query: ({ id, ...body }) => ({
        url: `/account-requests/admin/${id}/reject`,
        method: "PATCH",
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["AccountRequest"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useRefreshTokenMutation,
  useLogoutUserMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useResendVerificationMutation,
  useConfirmEmailMutation,
  useSetupMfaMutation,
  useVerifyMfaMutation,
  useListUsersQuery,
  useAssignRoleMutation,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useGdprDeleteMutation,
  useSubmitAccountRequestMutation,
  useGetMyRequestsQuery,
  useCancelRequestMutation,
  useGetAdminRequestsQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
} = authApi;
