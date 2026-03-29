import { lazy, Suspense } from "react";
import Logo from "@/components/ui/Logo";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/context/AuthContext";
import AuthGuard from "@/guards/AuthGuard";
import RoleGuard from "@/guards/RoleGuard";

// Layouts
const PublicLayout = lazy(() => import("@/components/layout/PublicLayout"));
const PortalLayout = lazy(() => import("@/components/layout/PortalLayout"));

// Public Pages
const LandingPage = lazy(() => import("@/pages/public/LandingPage"));
const EventListPage = lazy(() => import("@/pages/public/EventListPage"));
const EventDetailPage = lazy(() => import("@/pages/public/EventDetailPage"));
const AuthPage = lazy(() => import("@/pages/public/AuthPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/public/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/public/ResetPasswordPage"));
const VendorAuthPage = lazy(() => import("@/pages/public/VendorAuthPage"));
const PricingPage = lazy(() => import("@/pages/public/PricingPage"));
const SubscriptionCheckoutPage = lazy(() => import("@/pages/shared/SubscriptionCheckoutPage"));
const SubscriptionSuccessPage = lazy(() => import("@/pages/shared/SubscriptionSuccessPage"));

// Shared Authenticated Pages
const CheckoutPage = lazy(() => import("@/pages/shared/CheckoutPage"));
const TicketWalletPage = lazy(() => import("@/pages/shared/TicketWalletPage"));
const TicketPassPage = lazy(() => import("@/pages/shared/TicketPassPage"));
const GroupTicketPassPage = lazy(() => import("@/pages/shared/GroupTicketPassPage"));
const PaymentSuccessPage = lazy(() => import("@/pages/shared/PaymentSuccessPage"));
const MyRegistrationsPage = lazy(() => import("@/pages/shared/MyRegistrationsPage"));
const NotificationsPage = lazy(() => import("@/pages/shared/NotificationsPage"));
const SettingsPage = lazy(() => import("@/pages/shared/SettingsPage"));
const EventRegistrationsPage = lazy(() => import("@/pages/shared/EventRegistrationsPage"));
const MyReviewsPage = lazy(() => import("@/pages/shared/MyReviewsPage"));

// Customer Portal
const CustomerDashboardPage = lazy(() => import("@/pages/customer/CustomerDashboardPage"));
const BecomeVendorPage = lazy(() => import("@/pages/customer/BecomeVendorPage"));

// Vendor Portal
const VendorDashboardPage = lazy(() => import("@/pages/vendor/VendorDashboardPage"));
const VendorEventsPage = lazy(() => import("@/pages/vendor/VendorEventsPage"));
const VendorVenuesPage = lazy(() => import("@/pages/vendor/VendorVenuesPage"));
const VendorCheckInPage = lazy(() => import("@/pages/vendor/VendorCheckInPage"));
const VendorFinancePage = lazy(() => import("@/pages/vendor/VendorFinancePage"));
const VendorReportsPage = lazy(() => import("@/pages/vendor/VendorReportsPage"));
const VendorReviewsPage = lazy(() => import("@/pages/vendor/VendorReviewsPage"));
const VendorServicesPage = lazy(() => import("@/pages/vendor/VendorServicesPage"));

// Admin Portal
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminEventsPage = lazy(() => import("@/pages/admin/AdminEventsPage"));
const AdminCheckInPage = lazy(() => import("@/pages/admin/AdminCheckInPage"));
const AdminVenuesPage = lazy(() => import("@/pages/admin/AdminVenuesPage"));
const AdminFinancePage = lazy(() => import("@/pages/admin/AdminFinancePage"));
const AdminReportsPage = lazy(() => import("@/pages/admin/AdminReportsPage"));
const AdminVendorsPage = lazy(() => import("@/pages/admin/AdminVendorsPage"));
const AdminApplicationsPage = lazy(() => import("@/pages/admin/AdminApplicationsPage"));
const AdminReviewsPage = lazy(() => import("@/pages/admin/AdminReviewsPage"));
const AdminSubscriptionsPage = lazy(() => import("@/pages/admin/AdminSubscriptionsPage"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-cream">
      <div className="text-center">
        <div className="animate-pulse mb-2">
          <Logo size={40} showText />
        </div>
        <div className="w-48 h-1 bg-border-light rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-amber rounded-full animate-shimmer w-1/3" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Vendor SSO-style login (standalone layout) */}
            <Route path="/auth/vendor" element={<VendorAuthPage />} />

            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/events" element={<EventListPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/pricing" element={<PricingPage />} />
            </Route>

            {/* Authenticated Shared Routes */}
            <Route
              element={
                <AuthGuard>
                  <PortalLayout />
                </AuthGuard>
              }
            >
              <Route path="/events/:id/checkout" element={<CheckoutPage />} />
              <Route path="/events/:id/checkout/:ticketTypeId" element={<CheckoutPage />} />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/my/tickets" element={<TicketWalletPage />} />
              <Route path="/my/tickets/group" element={<GroupTicketPassPage />} />
              <Route path="/my/tickets/:registrationId/pass" element={<TicketPassPage />} />
              <Route path="/my/registrations" element={<MyRegistrationsPage />} />
              <Route path="/account/notifications" element={<NotificationsPage />} />
              <Route path="/account/settings" element={<SettingsPage />} />
              <Route path="/my/reviews" element={<MyReviewsPage />} />
              <Route path="/subscription/checkout/:planId" element={<SubscriptionCheckoutPage />} />
              <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />

              {/* Customer Portal */}
              <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
              <Route path="/customer/become-vendor" element={<BecomeVendorPage />} />

              {/* Vendor Portal */}
              <Route
                path="/vendor/dashboard"
                element={
                  <RoleGuard roles={["ORGANIZER", "VENDOR"]}>
                    <VendorDashboardPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/vendor/events"
                element={
                  <RoleGuard roles={["ORGANIZER", "VENDOR"]}>
                    <VendorEventsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/vendor/events/:eventId/registrations"
                element={
                  <RoleGuard roles={["ORGANIZER", "VENDOR"]}>
                    <EventRegistrationsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/vendor/venues"
                element={
                  <RoleGuard roles={["ORGANIZER", "VENDOR"]}>
                    <VendorVenuesPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/vendor/check-in"
                element={
                  <RoleGuard roles={["ORGANIZER", "VENDOR"]}>
                    <VendorCheckInPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/vendor/finance"
                element={
                  <RoleGuard roles={["ORGANIZER", "VENDOR"]}>
                    <VendorFinancePage />
                  </RoleGuard>
                }
              />
              <Route
                path="/vendor/reports"
                element={
                  <RoleGuard roles={["ORGANIZER", "VENDOR"]}>
                    <VendorReportsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/vendor/reviews"
                element={
                  <RoleGuard roles={["ORGANIZER", "VENDOR"]}>
                    <VendorReviewsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/vendor/services"
                element={
                  <RoleGuard roles={["ORGANIZER", "VENDOR"]}>
                    <VendorServicesPage />
                  </RoleGuard>
                }
              />

              {/* Admin Portal */}
              <Route
                path="/admin/dashboard"
                element={
                  <RoleGuard roles={["ADMIN"]}>
                    <AdminDashboardPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/events"
                element={
                  <RoleGuard roles={["ADMIN"]}>
                    <AdminEventsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/events/:eventId/registrations"
                element={
                  <RoleGuard roles={["ADMIN"]}>
                    <EventRegistrationsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/check-in"
                element={
                  <RoleGuard roles={["ADMIN"]}>
                    <AdminCheckInPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/venues"
                element={
                  <RoleGuard roles={["ADMIN"]}>
                    <AdminVenuesPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/finance"
                element={
                  <RoleGuard roles={["ADMIN"]}>
                    <AdminFinancePage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <RoleGuard roles={["ADMIN"]}>
                    <AdminReportsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/vendors"
                element={
                  <RoleGuard roles={["ADMIN"]}>
                    <AdminVendorsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/applications"
                element={
                  <RoleGuard roles={["ADMIN"]}>
                    <AdminApplicationsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/reviews"
                element={
                  <RoleGuard roles={["ADMIN"]}>
                    <AdminReviewsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/subscriptions"
                element={
                  <RoleGuard roles={["ADMIN"]}>
                    <AdminSubscriptionsPage />
                  </RoleGuard>
                }
              />
            </Route>
          </Routes>
        </AnimatePresence>
      </Suspense>
    </AuthProvider>
  );
}
