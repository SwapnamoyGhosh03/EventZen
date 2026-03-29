import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import {
  setCredentials,
  setToken,
  setLoading,
  logout,
} from "@/store/slices/authSlice";
import type { User } from "@/store/slices/authSlice";
import { useGetMeQuery, useRefreshTokenMutation } from "@/store/api/authApi";
import { PORTAL_ROUTES } from "@/config/constants";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  portalPath: string;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  portalPath: "/customer/dashboard",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const { user, accessToken, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  const [refreshToken] = useRefreshTokenMutation();
  const { data: meData, error: meError } = useGetMeQuery(undefined, {
    skip: !accessToken,
  });

  // Try to refresh token on mount
  useEffect(() => {
    async function tryRefresh() {
      try {
        const result = await refreshToken().unwrap();
        if (result.accessToken) {
          // Token refreshed, getMe will fire automatically
          dispatch(setToken(result.accessToken));
        }
      } catch {
        dispatch(logout());
      }
    }

    if (!accessToken) {
      tryRefresh();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update user from getMe response
  useEffect(() => {
    if (meData && accessToken) {
      dispatch(setCredentials({ user: meData, accessToken }));
    }
    if (meError) {
      dispatch(setLoading(false));
    }
  }, [meData, meError, accessToken, dispatch]);

  const portalPath =
    user?.role && PORTAL_ROUTES[user.role]
      ? PORTAL_ROUTES[user.role]
      : "/customer/dashboard";

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, portalPath }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
