import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star, Send } from "lucide-react";
import Button from "@/components/ui/Button";
import { feedbackSchema, type FeedbackFormData } from "@/utils/validators";
import { useSubmitFeedbackMutation } from "@/store/api/ticketApi";

interface FeedbackFormProps {
  eventId: string;
  onSuccess?: () => void;
}

export default function FeedbackForm({ eventId, onSuccess }: FeedbackFormProps) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitFeedback, { isLoading }] = useSubmitFeedbackMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema) as any,
    defaultValues: { rating: 0, comment: "" },
  });

  const rating = watch("rating");

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      await submitFeedback({ eventId, data }).unwrap();
      onSuccess?.();
    } catch {
      // handled by toast
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block font-body text-sm font-medium text-near-black mb-2">
          Rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setValue("rating", star)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={`
                  transition-colors
                  ${(hoveredStar || rating) >= star ? "fill-amber text-amber" : "text-border-light"}
                `}
              />
            </button>
          ))}
        </div>
        {errors.rating && (
          <p className="text-sm text-burgundy mt-1">{errors.rating.message}</p>
        )}
      </div>

      <div>
        <label className="block font-body text-sm font-medium text-near-black mb-1.5">
          Comment (optional)
        </label>
        <textarea
          {...register("comment")}
          rows={3}
          placeholder="Share your experience..."
          className="w-full bg-white border-[1.5px] border-warm-tan rounded-md px-4 py-3 font-body text-sm text-near-black placeholder:text-muted-gray focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(212,168,67,0.15)] transition-all resize-none"
        />
      </div>

      <Button type="submit" isLoading={isLoading} className="gap-2">
        <Send size={16} />
        Submit Feedback
      </Button>
    </form>
  );
}
