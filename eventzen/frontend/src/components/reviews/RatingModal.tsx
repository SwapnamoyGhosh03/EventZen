import { useState } from "react";
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import EmojiRating from "@/components/ui/EmojiRating";
import { useSubmitReviewMutation } from "@/store/api/reviewApi";

interface RatingModalProps {
  eventId: string;
  eventTitle: string;
  vendorId?: string;
  vendorName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const STEPS = [
  {
    key: "event",
    title: "Rate the Event",
    subtitle: "How was the overall event experience?",
    icon: "🎉",
  },
  {
    key: "vendor",
    title: "Rate the Organizer",
    subtitle: "How did the organizer perform?",
    icon: "🧑‍💼",
  },
  {
    key: "platform",
    title: "Rate EventZen",
    subtitle: "How was your experience with our platform?",
    icon: "⚡",
  },
];

export default function RatingModal({
  eventId,
  eventTitle,
  vendorName,
  onClose,
  onSuccess,
}: RatingModalProps) {
  const [step, setStep] = useState(0);
  const [eventRating, setEventRating] = useState(0);
  const [vendorRating, setVendorRating] = useState(0);
  const [platformRating, setPlatformRating] = useState(0);
  const [eventComment, setEventComment] = useState("");
  const [vendorComment, setVendorComment] = useState("");
  const [platformComment, setPlatformComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [submitReview, { isLoading }] = useSubmitReviewMutation();

  const currentRating = [eventRating, vendorRating, platformRating][step];

  const canNext = currentRating > 0;

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!canNext) return;
    setError("");
    try {
      await submitReview({
        eventId,
        eventRating,
        vendorRating,
        platformRating,
        eventComment: eventComment.trim() || undefined,
        vendorComment: vendorComment.trim() || undefined,
        platformComment: platformComment.trim() || undefined,
      }).unwrap();

      // Persist locally so wallet can hide "Rate" button without extra API call
      try {
        const key = "eventzen_reviewed";
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        if (!existing.includes(eventId)) {
          localStorage.setItem(key, JSON.stringify([...existing, eventId]));
        }
      } catch {}

      setSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.data?.message || "Failed to submit review. Please try again.");
    }
  };

  if (submitted) {
    return (
      <Modal isOpen onClose={onClose} title="" size="sm">
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-sage/10 rounded-full flex items-center justify-center">
            <CheckCircle size={32} className="text-sage" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-near-black mb-1">
              Thank you!
            </h2>
            <p className="font-body text-sm text-dark-gray">
              Your ratings for <strong>{eventTitle}</strong> have been submitted.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2 text-2xl">
            <span title={`Event: ${eventRating}/5`}>🎉 {eventRating}⭐</span>
            <span title={`Organizer: ${vendorRating}/5`}>🧑‍💼 {vendorRating}⭐</span>
            <span title={`Platform: ${platformRating}/5`}>⚡ {platformRating}⭐</span>
          </div>
          <Button fullWidth onClick={onClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  const currentStep = STEPS[step];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Review: ${eventTitle}`}
      size="sm"
    >
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`h-2 rounded-full transition-all duration-300 ${
              i < step
                ? "w-6 bg-amber"
                : i === step
                ? "w-8 bg-amber"
                : "w-2 bg-border-light"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          {/* Step header */}
          <div className="text-center">
            <span className="text-4xl">{currentStep.icon}</span>
            <h3 className="font-heading text-lg font-semibold text-near-black mt-2">
              {currentStep.title}
            </h3>
            <p className="font-body text-sm text-muted-gray mt-0.5">
              {step === 1 && vendorName
                ? `How did ${vendorName} do?`
                : currentStep.subtitle}
            </p>
          </div>

          {/* Emoji Rating */}
          {step === 0 && (
            <EmojiRating value={eventRating} onChange={setEventRating} size="lg" />
          )}
          {step === 1 && (
            <EmojiRating value={vendorRating} onChange={setVendorRating} size="lg" />
          )}
          {step === 2 && (
            <EmojiRating value={platformRating} onChange={setPlatformRating} size="lg" />
          )}

          {/* Optional comment */}
          <div>
            <label className="block font-body text-xs font-medium text-muted-gray uppercase tracking-wider mb-1.5">
              Comments <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Share your thoughts..."
              value={
                step === 0
                  ? eventComment
                  : step === 1
                  ? vendorComment
                  : platformComment
              }
              onChange={(e) => {
                if (step === 0) setEventComment(e.target.value);
                else if (step === 1) setVendorComment(e.target.value);
                else setPlatformComment(e.target.value);
              }}
              className="w-full bg-white border-[1.5px] border-warm-tan rounded-md px-4 py-3 font-body text-sm text-near-black placeholder:text-muted-gray focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(212,168,67,0.15)] transition-all resize-none"
            />
          </div>

          {error && (
            <p className="font-body text-sm text-burgundy text-center">{error}</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-light">
        <Button
          variant="ghost"
          onClick={step === 0 ? onClose : handleBack}
          className="gap-1"
        >
          {step === 0 ? "Cancel" : <><ChevronLeft size={16} /> Back</>}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canNext} className="gap-1">
            Next <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canNext}
            isLoading={isLoading}
          >
            Submit Ratings
          </Button>
        )}
      </div>
    </Modal>
  );
}
