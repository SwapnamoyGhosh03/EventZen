import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState, AppDispatch } from "@/store/store";
import { setCredentials, logout as logoutAction } from "@/store/slices/authSlice";
import {
  authApi,
  useLoginMutation,
  useRegisterMutation,
  useLogoutUserMutation,
  useRefreshTokenMutation,
} from "@/store/api/authApi";
import { eventApi } from "@/store/api/eventApi";
import { ticketApi } from "@/store/api/ticketApi";
import { paymentApi } from "@/store/api/paymentApi";
import { venueApi } from "@/store/api/venueApi";
import { PORTAL_ROUTES } from "@/config/constants";

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegisterLoading }] =
    useRegisterMutation();
  const [logoutMutation] = useLogoutUserMutation();
  const [refreshMutation] = useRefreshTokenMutation();

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation({ email, password }).unwrap();
      dispatch(setCredentials(result));
      const role = result.user?.role || "CUSTOMER";
      navigate(PORTAL_ROUTES[role] || "/customer/dashboard");
      return result;
    },
    [loginMutation, dispatch, navigate]
  );

  const register = useCallback(
    async (data: any) => {
      const result = await registerMutation(data).unwrap();
      return result;
    },
    [registerMutation]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Logout even if the API call fails
    }
    dispatch(logoutAction());
    // Reset all RTK Query caches so stale user data doesn't persist
    dispatch(authApi.util.resetApiState());
    dispatch(eventApi.util.resetApiState());
    dispatch(ticketApi.util.resetApiState());
    dispatch(paymentApi.util.resetApiState());
    dispatch(venueApi.util.resetApiState());
    navigate("/auth");
  }, [logoutMutation, dispatch, navigate]);

  const refreshToken = useCallback(async () => {
    try {
      const result = await refreshMutation().unwrap();
      return result.accessToken;
    } catch {
      dispatch(logoutAction());
      return null;
    }
  }, [refreshMutation, dispatch]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    isLoginLoading,
    isRegisterLoading,
    login,
    register,
    logout,
    refreshToken,
  };
}
