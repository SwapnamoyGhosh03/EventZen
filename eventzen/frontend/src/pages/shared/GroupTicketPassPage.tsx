import { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Users, ShieldCheck, Copy, Check, ImageDown } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import { QRCodeCanvas } from "qrcode.react";
import Badge from "@/components/ui/Badge";
import { useGetEventQuery } from "@/store/api/eventApi";
import { useAuthContext } from "@/context/AuthContext";
import { formatShortDate } from "@/utils/formatters";

export default function GroupTicketPassPage() {
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const { user } = useAuthContext();
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const qrsParam = searchParams.get("qrs") || "";
  const eventId = searchParams.get("event") || "";
  const tier = searchParams.get("tier") || "General";

  // Each entry is an HMAC-signed QR code: "{ticketId}:{hmac}"
  const qrCodes = qrsParam ? qrsParam.split(",").filter(Boolean) : [];
  const qty = qrCodes.length;

  // Extract raw ticket IDs for human-readable display
  const ticketIds = qrCodes.map((q) => q.split(":")[0]);

  const { data: event } = useGetEventQuery(eventId, { skip: !eventId });

  const eventName = event?.title || "Event";
  const eventDate = event?.startDate || event?.date;
  const eventCity = event?.city;
  const attendeeName = user ? `${user.firstName} ${user.lastName}`.trim() : undefined;

  // Combined QR value — each ticket entry IS a valid HMAC-signed code that the check-in backend accepts.
  // The check-in scanner detects the EVENTZEN_GROUP type and scans each ticket individually.
  const qrValue = JSON.stringify({
    type: "EVENTZEN_GROUP",
    eventId,
    tier,
    qty,
    tickets: qrCodes,
  });

  function downloadQrPng() {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `eventzen-group-qr-${eventId.slice(0, 8)}.png`;
    a.click();
  }

  function copyIds() {
    navigator.clipboard.writeText(ticketIds.join(", ")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!qty) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto py-4 text-center pt-16">
          <p className="font-body text-muted-gray mb-4">No tickets specified.</p>
          <Link to="/my/tickets" className="text-amber text-sm hover:underline">
            Back to Wallet
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-md mx-auto py-4">
        <Link
          to="/my/tickets"
          className="inline-flex items-center gap-1.5 font-body text-sm text-muted-gray hover:text-amber transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Tickets
        </Link>

        <div className="bg-white border border-border-light rounded-2xl overflow-hidden shadow-warm-md">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber to-amber-dark p-6 text-center text-white">
            <p className="font-accent text-xs uppercase tracking-widest text-white/60 mb-1">
              Group Pass
            </p>
            <h2 className="font-heading text-2xl font-bold mb-1">{eventName}</h2>
            <div className="flex items-center justify-center gap-4 mt-2 text-white/75 text-sm font-body">
              {eventDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {formatShortDate(eventDate)}
                </span>
              )}
              {eventCity && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {eventCity}
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="info">{tier}</Badge>
              <span className="flex items-center gap-1 font-body text-xs text-white/70 bg-white/10 px-2.5 py-0.5 rounded-full">
                <Users size={11} />
                {qty} ticket{qty !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* QR Code — canvas at 320px, level L for max readability */}
          <div className="px-8 pt-8 pb-4 text-center">
            <div className="inline-flex items-center justify-center p-4 bg-white border-2 border-border-light rounded-xl">
              <QRCodeCanvas
                ref={(el) => { if (el) qrCanvasRef.current = el; }}
                value={qrValue}
                size={320}
                level="L"
                bgColor="#FFFFFF"
                fgColor="#1E1E1E"
              />
            </div>
            <p className="font-body text-xs text-muted-gray mt-3">
              Scan to check in {qty} {tier} attendee{qty !== 1 ? "s" : ""}
            </p>
            <button
              type="button"
              onClick={downloadQrPng}
              className="mt-2 inline-flex items-center gap-1.5 font-body text-xs text-muted-gray hover:text-amber transition-colors"
            >
              <ImageDown size={13} />
              Download QR as PNG
            </button>
          </div>

          {/* Group summary strip */}
          <div className="mx-6 mb-5 p-3 bg-cream rounded-xl border border-border-light flex items-center gap-3">
            <ShieldCheck size={18} className="text-amber flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-accent text-[9px] uppercase tracking-widest text-muted-gray mb-0.5">
                Group Booking
              </p>
              <p className="font-body text-sm font-semibold text-near-black truncate">
                {tier} · {qty} ticket{qty !== 1 ? "s" : ""}
                {attendeeName ? ` · ${attendeeName}` : ""}
              </p>
            </div>
            <button
              onClick={copyIds}
              className="flex items-center gap-1 text-xs font-body text-muted-gray hover:text-amber transition-colors shrink-0"
            >
              {copied ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} />
              )}
              <span>{copied ? "Copied" : "Copy IDs"}</span>
            </button>
          </div>

          {/* Individual ticket list */}
          <div className="px-6 pb-6">
            <p className="font-accent text-[10px] uppercase tracking-widest text-muted-gray mb-2">
              Included Tickets
            </p>
            <div className="space-y-0">
              {ticketIds.map((id, i) => (
                <div
                  key={id || i}
                  className="flex items-center gap-3 py-2.5 border-t border-border-light"
                >
                  <div className="w-6 h-6 rounded-full bg-amber/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-accent text-[10px] font-bold text-amber">
                      {i + 1}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-muted-gray flex-1 min-w-0 truncate">
                    #{id.replace(/-/g, "").slice(0, 12).toUpperCase()}
                  </span>
                  <Link
                    to={`/my/tickets/${id}/pass`}
                    className="font-body text-[11px] text-amber hover:underline shrink-0"
                  >
                    Individual →
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Perforated divider */}
          <div className="flex items-center px-4">
            <div className="flex-1 border-t-2 border-dashed border-border-light" />
          </div>

          <div className="px-5 py-3 flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] text-muted-gray">
              GROUP · {eventId.replace(/-/g, "").slice(0, 8).toUpperCase()}
            </p>
            <p className="font-body text-[10px] text-muted-gray">EventZen</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
