import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface EventFiltersProps {
  onFilter: (filters: Record<string, string>) => void;
  categories?: string[];
  hideStatus?: boolean;
}

const categoryOptions = [
  { value: "", label: "All Categories" },
  { value: "Technology", label: "Technology" },
  { value: "Music", label: "Music" },
  { value: "Business", label: "Business" },
  { value: "Art", label: "Art" },
  { value: "Sports", label: "Sports" },
  { value: "Food", label: "Food & Drink" },
  { value: "Education", label: "Education" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REGISTRATION_OPEN", label: "Registration Open" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
];

export default function EventFilters({ onFilter, categories, hideStatus }: EventFiltersProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const catOptions = categories
    ? [
        { value: "", label: "All Categories" },
        ...categories.map((c) => ({ value: c, label: c })),
      ]
    : categoryOptions;

  const applyFilters = () => {
    const filters: Record<string, string> = {};
    if (search) filters.q = search;
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (city) filters.city = city;
    onFilter(filters);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setCity("");
    onFilter({});
  };

  const hasFilters = search || category || status || city;

  return (
    <div className="bg-white border border-border-light rounded-lg p-4 md:p-6 mb-8">
      {/* Search row */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-gray"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Search events..."
            className="w-full bg-white border-[1.5px] border-warm-tan rounded-md pl-10 pr-4 py-3 font-body text-sm text-near-black placeholder:text-muted-gray focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(212,168,67,0.15)] transition-all"
          />
        </div>
        <Button onClick={applyFilters} size="md">
          Search
        </Button>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="p-3 border border-border-light rounded-md text-dark-gray hover:bg-cream transition-colors"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className={`grid gap-3 pt-3 border-t border-border-light ${hideStatus ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              applyFilters();
            }}
            options={catOptions}
            placeholder="Category"
          />
          {!hideStatus && (
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                applyFilters();
              }}
              options={statusOptions}
              placeholder="Status"
            />
          )}
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>
      )}

      {/* Active filters */}
      {hasFilters && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-light">
          <span className="font-body text-xs text-muted-gray">Active:</span>
          {search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber/10 text-amber rounded-md text-xs font-body">
              &quot;{search}&quot;
              <button onClick={() => { setSearch(""); applyFilters(); }}>
                <X size={12} />
              </button>
            </span>
          )}
          {category && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber/10 text-amber rounded-md text-xs font-body">
              {category}
              <button onClick={() => { setCategory(""); applyFilters(); }}>
                <X size={12} />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="ml-auto font-body text-xs text-muted-gray hover:text-burgundy transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
