import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { authApi } from "./api/authApi";
import { eventApi } from "./api/eventApi";
import { ticketApi } from "./api/ticketApi";
import { paymentApi } from "./api/paymentApi";
import { venueApi } from "./api/venueApi";
import { reviewApi } from "./api/reviewApi";
import { notificationApi } from "./api/notificationApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [eventApi.reducerPath]: eventApi.reducer,
    [ticketApi.reducerPath]: ticketApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [venueApi.reducerPath]: venueApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(eventApi.middleware)
      .concat(ticketApi.middleware)
      .concat(paymentApi.middleware)
      .concat(venueApi.middleware)
      .concat(reviewApi.middleware)
      .concat(notificationApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
