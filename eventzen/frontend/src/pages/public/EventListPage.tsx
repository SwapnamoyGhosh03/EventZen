import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, CalendarDays, CheckCircle2 } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import EventFilters from "@/components/events/EventFilters";
import EventGrid from "@/components/events/EventGrid";
import Pagination from "@/components/ui/Pagination";
import { useListEventsQuery } from "@/store/api/eventApi";
import { PAGINATION } from "@/config/constants";

type TabId = "REGISTRATION_OPEN" | "PUBLISHED" | "COMPLETED";

const tabs: { id: TabId; label: string; sublabel: string; icon: typeof Ticket }[] = [
  { id: "REGISTRATION_OPEN", label: "Registration Open", sublabel: "Register now", icon: Ticket },
  { id: "PUBLISHED",         label: "Upcoming",          sublabel: "Coming soon",   icon: CalendarDays },
  { id: "COMPLETED",         label: "Completed",         sublabel: "Past events",   icon: CheckCircle2 },
];

export default function EventListPage() {
  const [activeTab, setActiveTab] = useState<TabId>("REGISTRATION_OPEN");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Lightweight count queries for badge numbers
  const { data: countOpen }      = useListEventsQuery({ status: "REGISTRATION_OPEN", page: 0, size: 1 });
  const { data: countUpcoming }  = useListEventsQuery({ status: "PUBLISHED",         page: 0, size: 1 });
  const { data: countCompleted } = useListEventsQuery({ status: "COMPLETED",         page: 0, size: 1 });

  const tabCounts: Record<TabId, number | undefined> = {
    REGISTRATION_OPEN: countOpen?.meta?.totalElements,
    PUBLISHED:         countUpcoming?.meta?.totalElements,
    COMPLETED:         countCompleted?.meta?.totalElements,
  };

  // Main data query — status driven by active tab
  const { data, isLoading } = useListEventsQuery({
    page: page - 1,
    size: PAGINATION.DEFAULT_SIZE,
    ...filters,
    status: activeTab,
  });

  const events     = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
  const totalPages = data?.meta?.totalPages || 1;

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setPage(1);
  };

  const handleFilter = (f: Record<string, string>) => {
    setFilters(f);
    setPage(1);
  };

  const emptyMessages: Record<TabId, string> = {
    REGISTRATION_OPEN: "No events with open registration right now. Check back soon!",
    PUBLISHED:         "No upcoming events scheduled at the moment.",
    COMPLETED:         "No completed events yet.",
  };

  return (
    <PageTransition>
      <section className="section-cream section-padding">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-near-black mb-2">
              Discover Events
            </h1>
            <p className="font-body text-dark-gray">
              Find your next unforgettable experience
            </p>
          </div>

          {/* Tab bar */}
          <div className="bg-white border border-border-light rounded-xl p-1.5 mb-6 flex gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const count    = tabCounts[tab.id];
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                    font-body text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "bg-amber text-white shadow-sm"
                      : "text-dark-gray hover:text-near-black hover:bg-cream"
                    }
                  `}
                >
                  <tab.icon size={15} className="shrink-0" />
                  {/* Full label on md+, first word on mobile */}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                  {count !== undefined && count > 0 && (
                    <span
                      className={`
                        px-1.5 py-0.5 rounded-full text-[11px] font-bold leading-none
                        ${isActive ? "bg-white/25 text-white" : "bg-cream text-muted-gray"}
                      `}
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Filters — status dropdown hidden because tabs control it */}
          <EventFilters onFilter={handleFilter} hideStatus />

          {/* Grid with per-tab fade transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            >
              <EventGrid
                events={events}
                isLoading={isLoading}
                emptyMessage={emptyMessages[activeTab]}
              />
            </motion.div>
          </AnimatePresence>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              className="mt-10"
            />
          )}

        </div>
      </section>
    </PageTransition>
  );
}
