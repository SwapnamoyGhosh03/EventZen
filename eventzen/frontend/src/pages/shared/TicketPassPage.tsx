import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Mail, Hash, Calendar, MapPin, Copy, Check, ShieldCheck, Download, ImageDown } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import QRCodeDisplay from "@/components/tickets/QRCodeDisplay";
import { QRCodeCanvas } from "qrcode.react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { useGetTicketQuery, useGetMyTicketsQuery } from "@/store/api/ticketApi";
import { useGetEventQuery } from "@/store/api/eventApi";
import { useAuthContext } from "@/context/AuthContext";
import { formatShortDate } from "@/utils/formatters";
import { downloadElementAsPDF } from "@/utils/downloadPDF";

/** Format a UUID into XXXX-XXXX-XXXX-XXXX for human-readable verification */
function toVerificationCode(id: string): string {
  const clean = id.replace(/-/g, "").toUpperCase();
  return [clean.slice(0, 4), clean.slice(4, 8), clean.slice(8, 12), clean.slice(12, 16)]
    .filter(Boolean)
    .join("-");
}

export default function TicketPassPage() {
  const { registrationId } = useParams();
  const { data: ticket, isLoading, isError } = useGetTicketQuery(registrationId!);
  const { user } = useAuthContext();
  const { data: allTicketsData } = useGetMyTicketsQuery();
  const eventId = ticket?.eventId ?? "";
  const { data: event } = useGetEventQuery(eventId, { skip: !eventId });
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const passRef = useRef<HTMLDivElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Headcount: how many tickets this user has for the same event
  const allTickets: any[] = Array.isArray(allTicketsData?.content)
    ? allTicketsData.content
    : Array.isArray(allTicketsData)
    ? allTicketsData
    : [];
  const eventTickets = ticket
    ? allTickets.filter((t: any) => t?.eventId === ticket.eventId)
    : [];
  const ticketIndex = ticket
    ? eventTickets.findIndex(
        (t: any) => (t?.ticketId || t?.id) === (ticket.ticketId || ticket.id)
      )
    : -1;
  const headcount = eventTickets.length;

  const attendeeName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : undefined;
  const attendeeEmail = user?.email;

  // Event details: prefer denormalized fields on ticket, fall back to event API
  const eventName =
    event?.title || ticket?.eventTitle || ticket?.eventName || "Event Pass";
  const eventDate = event?.startDate || event?.date || ticket?.eventDate;
  const eventCity = event?.city || ticket?.eventCity;

  // QR value: prefer HMAC-signed qrCodeData, fall back to ticketId
  const ticketCode = ticket?.ticketId || ticket?.id || "";
  const qrValue = ticket
    ? ticket.qrCodeData || ticket.qrData || ticket.qrCode || ticketCode
    : "";

  // Short human-readable verification code from ticketId
  const verificationCode = ticketCode ? toVerificationCode(ticketCode) : null;

  // Booking reference: first 8 alphanumeric chars of registrationId
  const bookingRef = ticket?.registrationId
    ? ticket.registrationId.replace(/-/g, "").slice(0, 8).toUpperCase()
    : null;

  const purchaseDate = ticket?.createdAt
    ? new Date(ticket.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  function copyCode() {
    const val = qrValue || ticketCode;
    if (!val) return;
    navigator.clipboard.writeText(val).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownloadQrPng() {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    const slug = (eventName || "ticket").replace(/\s+/g, "-").toLowerCase();
    a.download = `eventzen-qr-${slug}.png`;
    a.click();
  }

  async function handleDownloadPass() {
    if (!passRef.current) return;
    setDownloading(true);
    try {
      const slug = (eventName || "ticket").replace(/\s+/g, "-").toLowerCase();
      await downloadElementAsPDF(passRef.current, `eventzen-pass-${slug}.pdf`);
    } finally {
      setDownloading(false);
    }
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

        {/* Loading */}
        {isLoading && (
          <div className="rounded-2xl overflow-hidden border border-border-light shadow-warm-md">
            <div className="h-28 bg-amber/20" />
            <Skeleton variant="rectangular" height={340} className="w-full rounded-none" />
          </div>
        )}

        {/* Error / Not found */}
        {!isLoading && (!ticket || isError) && (
          <div className="py-8 text-center">
            <h2 className="font-heading text-xl text-near-black mb-4">
              Ticket not found
            </h2>
            <Link to="/my/tickets">
              <Button variant="primary">Back to Wallet</Button>
            </Link>
          </div>
        )}

        {/* Ticket pass */}
        {!isLoading && ticket && !isError && (
          <>
          <div ref={passRef} className="relative bg-white border border-border-light rounded-2xl overflow-hidden shadow-warm-md">
            {/* Checked-in diagonal stamp */}
            {ticket.status === "USED" && (
              <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/8" />
                <div className="relative z-10 w-[145%] py-3 bg-burgundy/85 text-white text-xs font-bold tracking-[0.28em] uppercase text-center -rotate-[28deg] shadow-lg select-none">
                  ✓&nbsp;&nbsp;Checked In
                </div>
              </div>
            )}
            {/* Header */}
            <div className="bg-gradient-to-r from-amber to-amber-dark p-6 text-center text-white">
              <p className="font-accent text-xs uppercase tracking-widest text-white/60 mb-1">
                Event Pass
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
              {headcount > 1 && (
                <p className="font-body text-sm text-white/60 mt-1">
                  Ticket {ticketIndex >= 0 ? ticketIndex + 1 : "?"} of {headcount}
                </p>
              )}
            </div>

            {/* QR Code */}
            <div className="px-8 pt-8 pb-4 text-center">
              {qrValue ? (
                <>
                  <div className="inline-block">
                    <QRCodeDisplay value={qrValue} size={200} />
                  </div>
                  {/* Hidden high-res canvas for PNG download */}
                  <div className="hidden">
                    <QRCodeCanvas
                      ref={(el) => { if (el) qrCanvasRef.current = el; }}
                      value={qrValue}
                      size={600}
                      level="H"
                      bgColor="#FFFFFF"
                      fgColor="#1E1E1E"
                    />
                  </div>
                </>
              ) : (
                <div className="w-[200px] h-[200px] mx-auto bg-cream rounded-xl flex flex-col items-center justify-center gap-2 px-4 border border-border-light">
                  <span className="font-body text-xs text-muted-gray">Ticket Code</span>
                  <span className="font-mono text-sm text-near-black font-semibold break-all text-center">
                    {verificationCode || "—"}
                  </span>
                </div>
              )}
              <p className="font-body text-xs text-muted-gray mt-3">
                Show this at check-in
              </p>
              {qrValue && (
                <button
                  type="button"
                  onClick={handleDownloadQrPng}
                  className="mt-2 inline-flex items-center gap-1.5 font-body text-xs text-muted-gray hover:text-amber transition-colors"
                >
                  <ImageDown size={13} />
                  Download QR as PNG
                </button>
              )}
            </div>

            {/* Verification code — the key identity element */}
            {verificationCode && (
              <div className="mx-6 mb-5 p-3 bg-cream rounded-xl border border-border-light flex items-center gap-3">
                <ShieldCheck size={18} className="text-amber flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-accent text-[9px] uppercase tracking-widest text-muted-gray mb-0.5">
                    Verification Code
                  </p>
                  <p className="font-mono text-base font-bold text-near-black tracking-wider">
                    {verificationCode}
                  </p>
                </div>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1 text-xs font-body text-muted-gray hover:text-amber transition-colors"
                >
                  {copied ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            )}

            {/* Details */}
            <div className="px-6 pb-6 space-y-0">
              {bookingRef && (
                <div className="flex justify-between items-center py-3 border-t border-border-light">
                  <span className="font-body text-sm text-muted-gray">
                    Booking Ref
                  </span>
                  <span className="font-mono text-sm font-semibold text-amber tracking-widest">
                    {bookingRef}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-3 border-t border-border-light">
                <span className="font-body text-sm text-muted-gray">Ticket Type</span>
                <span className="font-body text-sm font-medium text-near-black">
                  {ticket.ticketType || ticket.type || "General"}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-t border-border-light">
                <span className="font-body text-sm text-muted-gray">Status</span>
                <Badge variant={ticket.status === "USED" ? "success" : "info"}>
                  {ticket.status === "USED" ? "Checked In" : "Valid"}
                </Badge>
              </div>

              {ticket.checkedInAt && (
                <div className="flex justify-between items-center py-3 border-t border-border-light">
                  <span className="font-body text-sm text-muted-gray">
                    Checked In At
                  </span>
                  <span className="font-body text-sm font-medium text-near-black">
                    {new Date(ticket.checkedInAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}

              {purchaseDate && (
                <div className="flex justify-between items-center py-3 border-t border-border-light">
                  <span className="font-body text-sm text-muted-gray flex items-center gap-1.5">
                    <Calendar size={13} />
                    Purchased
                  </span>
                  <span className="font-body text-sm font-medium text-near-black">
                    {purchaseDate}
                  </span>
                </div>
              )}

              {headcount > 0 && (
                <div className="flex justify-between items-center py-3 border-t border-border-light">
                  <span className="font-body text-sm text-muted-gray flex items-center gap-1.5">
                    <Hash size={13} />
                    Headcount
                  </span>
                  <span className="font-body text-sm font-medium text-near-black">
                    {headcount} {headcount === 1 ? "ticket" : "tickets"} for this event
                  </span>
                </div>
              )}

              {attendeeName && (
                <div className="flex justify-between items-center py-3 border-t border-border-light">
                  <span className="font-body text-sm text-muted-gray flex items-center gap-1.5">
                    <User size={13} />
                    Attendee
                  </span>
                  <span className="font-body text-sm font-medium text-near-black">
                    {attendeeName}
                  </span>
                </div>
              )}

              {attendeeEmail && (
                <div className="flex justify-between items-center py-3 border-t border-border-light">
                  <span className="font-body text-sm text-muted-gray flex items-center gap-1.5">
                    <Mail size={13} />
                    Email
                  </span>
                  <span className="font-body text-sm font-medium text-near-black truncate max-w-[200px]">
                    {attendeeEmail}
                  </span>
                </div>
              )}
            </div>

            {/* Perforated divider */}
            <div className="flex items-center px-4">
              <div className="flex-1 border-t-2 border-dashed border-border-light" />
            </div>

            {/* Full ticket ID stub */}
            <div className="px-5 py-3 flex items-center justify-between gap-2">
              <p className="font-mono text-[10px] text-muted-gray truncate">
                {ticketCode}
              </p>
              <p className="font-body text-[10px] text-muted-gray shrink-0">
                EventZen
              </p>
            </div>
          </div>

          {/* Download button — outside the ref so it doesn't appear in the PDF */}
          <Button
            fullWidth
            variant="secondary"
            onClick={handleDownloadPass}
            isLoading={downloading}
            className="mt-4 gap-2"
          >
            <Download size={16} />
            {downloading ? "Generating PDF…" : "Download Ticket PDF"}
          </Button>
          </>
        )}
      </div>
    </PageTransition>
  );
}
