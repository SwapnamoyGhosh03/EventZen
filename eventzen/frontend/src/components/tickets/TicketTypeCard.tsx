import { motion } from "framer-motion";
import { Check, Ticket } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatters";

interface TicketTypeCardProps {
  ticketType: any;
  isSelected?: boolean;
  onSelect: () => void;
}

export default function TicketTypeCard({
  ticketType,
  isSelected,
  onSelect,
}: TicketTypeCardProps) {
  const isSoldOut =
    ticketType.availableQuantity !== undefined &&
    ticketType.availableQuantity <= 0;

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`
        relative bg-white border-2 rounded-lg p-6
        transition-all duration-200 cursor-pointer
        ${isSelected ? "border-amber shadow-warm-md" : "border-border-light hover:border-amber/50"}
        ${isSoldOut ? "opacity-60 cursor-not-allowed" : ""}
      `}
      onClick={() => !isSoldOut && onSelect()}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber text-white flex items-center justify-center">
          <Check size={14} />
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
          <Ticket size={20} className="text-amber" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-near-black">
          {ticketType.name}
        </h3>
      </div>

      {ticketType.description && (
        <p className="font-body text-sm text-dark-gray mb-4">
          {ticketType.description}
        </p>
      )}

      <div className="flex items-end justify-between">
        <div>
          <span className="font-heading text-2xl font-bold text-amber">
            {ticketType.price === 0 ? "Free" : formatCurrency(ticketType.price)}
          </span>
          {ticketType.availableQuantity !== undefined && (
            <p className="font-body text-xs text-muted-gray mt-1">
              {isSoldOut
                ? "Sold out"
                : `${ticketType.availableQuantity} remaining`}
            </p>
          )}
        </div>

        {!isSoldOut && (
          <Button
            variant={isSelected ? "primary" : "outlined"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            {isSelected ? "Selected" : "Select"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
