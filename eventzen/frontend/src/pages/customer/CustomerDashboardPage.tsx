import { Link } from "react-router-dom";
import { Ticket, Calendar, IndianRupee, QrCode, ArrowRight } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import StatCard from "@/components/dashboard/StatCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useGetMyTicketsQuery, useGetMyRegistrationsQuery } from "@/store/api/ticketApi";
import { formatShortDate, formatCurrency } from "@/utils/formatters";

export default function CustomerDashboardPage() {
  const { data: ticketsData } = useGetMyTicketsQuery();
  const { data: regData } = useGetMyRegistrationsQuery();

  const tickets = ticketsData?.content || ticketsData || [];
  const registrations = regData?.content || regData || [];

  const totalSpent = registrations.reduce(
    (sum: number, r: any) => sum + (r.amount || 0),
    0
  );
  const checkedIn = tickets.filter((t: any) => t.checkedIn).length;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
            Welcome Back
          </h1>
          <p className="font-body text-dark-gray">
            Here&apos;s an overview of your event activity
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Calendar size={20} />}
            label="Registrations"
            value={registrations.length}
            color="bg-amber/10 text-amber"
          />
          <StatCard
            icon={<Ticket size={20} />}
            label="Active Tickets"
            value={tickets.length}
            color="bg-sage/10 text-sage"
          />
          <StatCard
            icon={<IndianRupee size={20} />}
            label="Total Spent"
            value={formatCurrency(totalSpent)}
            color="bg-dusty-blue/10 text-dusty-blue"
          />
          <StatCard
            icon={<QrCode size={20} />}
            label="Checked In"
            value={checkedIn}
            color="bg-burgundy/10 text-burgundy"
          />
        </div>

        {/* Recent Registrations */}
        <Card hover={false} padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-near-black">
              Recent Registrations
            </h2>
            <Link
              to="/my/registrations"
              className="flex items-center gap-1 font-body text-sm text-amber hover:text-amber-dark transition-colors"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {registrations.length === 0 ? (
            <p className="font-body text-muted-gray text-center py-8">
              No registrations yet.{" "}
              <Link to="/events" className="text-amber hover:underline">
                Browse events
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {registrations.slice(0, 5).map((reg: any) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between py-3 border-b border-border-light last:border-0"
                >
                  <div>
                    <p className="font-body text-sm font-medium text-near-black">
                      {reg.eventTitle || reg.eventName || "Event"}
                    </p>
                    {reg.registrationDate && (
                      <p className="font-body text-xs text-muted-gray">
                        {formatShortDate(reg.registrationDate)}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      reg.status === "CONFIRMED"
                        ? "success"
                        : reg.status === "CANCELLED"
                          ? "danger"
                          : "info"
                    }
                  >
                    {reg.status || "Confirmed"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
