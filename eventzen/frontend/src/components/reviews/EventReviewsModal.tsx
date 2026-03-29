import { useState } from "react";
import { Star, Eye, EyeOff } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useGetEventReviewsListQuery, useToggleShowcaseMutation } from "@/store/api/reviewApi";

const EMOJIS = ["", "😞", "😕", "😐", "😊", "🤩"];

interface Props {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

export default function EventReviewsModal({ eventId, eventTitle, onClose }: Props) {
  const { data, isLoading } = useGetEventReviewsListQuery(eventId);
  const [toggleShowcase] = useToggleShowcaseMutation();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const reviews: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
    ? data.content
    : [];

  const handleToggle = async (feedbackId: string, current: boolean) => {
    setTogglingId(feedbackId);
    try {
      await toggleShowcase({ eventId, feedbackId, showcase: !current }).unwrap();
    } catch {}
    setTogglingId(null);
  };

  const showcasedCount = reviews.filter((r) => r.isShowcased).length;

  return (
    <Modal isOpen onClose={onClose} title={`Reviews — ${eventTitle}`} size="lg">
      {isLoading ? (
        <div className="py-10 text-center font-body text-sm text-muted-gray">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="py-10 text-center">
          <Star size={28} className="mx-auto text-muted-gray mb-2" />
          <p className="font-body text-sm text-muted-gray">No reviews submitted yet.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="font-body text-xs text-muted-gray">
              <span className="font-semibold text-near-black">{reviews.length}</span> review{reviews.length !== 1 ? "s" : ""} ·{" "}
              <span className="text-amber font-semibold">{showcasedCount}</span> showcased publicly
            </p>
            <p className="font-body text-[11px] text-muted-gray italic">
              Toggle <Eye size={11} className="inline" /> to show on the public event page
            </p>
          </div>

          <div className="space-y-3 max-h-[58vh] overflow-y-auto pr-1">
            {reviews.map((r: any, i: number) => (
              <div
                key={r.feedbackId || i}
                className={`border rounded-xl p-4 transition-all ${
                  r.isShowcased
                    ? "border-amber/40 bg-amber/5"
                    : "border-border-light bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Three ratings */}
                    <div className="flex flex-wrap gap-4">
                      {[
                        { label: "Event", value: r.eventRating, comment: r.eventComment },
                        { label: "Organizer", value: r.vendorRating, comment: r.vendorComment },
                        { label: "Platform", value: r.platformRating, comment: r.platformComment },
                      ].map(({ label, value, comment }) => (
                        <div key={label} className="text-center min-w-[64px]">
                          <p className="font-accent text-[9px] uppercase tracking-wider text-muted-gray mb-0.5">{label}</p>
                          <p className="text-xl leading-none">{EMOJIS[value] || "—"}</p>
                          <div className="flex justify-center gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={9}
                                className={s <= value ? "text-amber fill-amber" : "text-border-light fill-border-light"}
                              />
                            ))}
                          </div>
                          <p className="font-body text-[10px] font-semibold text-near-black mt-0.5">{value}/5</p>
                          {comment && (
                            <p className="font-body text-[10px] text-muted-gray mt-1 italic line-clamp-2">
                              "{comment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="font-body text-[10px] text-muted-gray">
                      Submitted{" "}
                      {new Date(r.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Showcase toggle */}
                  <Button
                    variant={r.isShowcased ? "primary" : "ghost"}
                    size="sm"
                    className={`gap-1.5 shrink-0 ${!r.isShowcased ? "border border-border-light" : ""}`}
                    onClick={() => handleToggle(r.feedbackId, r.isShowcased)}
                    isLoading={togglingId === r.feedbackId}
                    disabled={togglingId !== null && togglingId !== r.feedbackId}
                  >
                    {r.isShowcased ? (
                      <><Eye size={13} /> Showcased</>
                    ) : (
                      <><EyeOff size={13} /> Showcase</>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
