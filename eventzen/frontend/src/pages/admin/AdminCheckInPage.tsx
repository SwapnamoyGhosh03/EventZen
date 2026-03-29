import { useState } from "react";
import { QrCode, Users, CheckCircle, BarChart3, Search, ImageIcon, Keyboard } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import StatCard from "@/components/dashboard/StatCard";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Progress from "@/components/ui/Progress";
import QRImageUpload from "@/components/tickets/QRImageUpload";
import { useScanCheckInMutation, useGetCheckInStatsQuery } from "@/store/api/ticketApi";
import { useListEventsQuery } from "@/store/api/eventApi";

type Tab = "manual" | "image";

export default function AdminCheckInPage() {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [tab, setTab] = useState<Tab>("manual");
  const [qrInput, setQrInput] = useState("");
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: eventsData } = useListEventsQuery({ size: 100 });
  const { data: stats } = useGetCheckInStatsQuery(selectedEvent, { skip: !selectedEvent });
  const [scanCheckIn, { isLoading }] = useScanCheckInMutation();

  const events = Array.isArray(eventsData?.content) ? eventsData.content : Array.isArray(eventsData) ? eventsData : [];
  const eventOptions = events.map((e: any) => ({ value: e.eventId || e.id, label: e.title }));

  async function processQrValue(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Detect group QR (JSON produced by GroupTicketPassPage)
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.type === "EVENTZEN_GROUP" && Array.isArray(parsed.tickets)) {
          let ok = 0;
          let fail = 0;
          for (const code of parsed.tickets as string[]) {
            try {
              await scanCheckIn({ qrCodeData: code, eventId: selectedEvent || undefined }).unwrap();
              ok++;
            } catch {
              fail++;
            }
          }
          setScanResult({
            success: ok > 0,
            message:
              fail === 0
                ? `${ok} ticket${ok !== 1 ? "s" : ""} checked in successfully!`
                : `${ok} checked in, ${fail} already used or invalid.`,
          });
          setQrInput("");
          return;
        }
      } catch {
        // Not valid group JSON — fall through to individual scan
      }
    }

    // Individual ticket scan
    try {
      const result = await scanCheckIn({ qrCodeData: trimmed, eventId: selectedEvent || undefined }).unwrap();
      setScanResult({ success: true, message: result.message || "Check-in successful!" });
      setQrInput("");
    } catch (err: any) {
      setScanResult({ success: false, message: err?.data?.message || "Check-in failed." });
    }
  }

  const handleScan = () => processQrValue(qrInput);

  function handleImageDetected(value: string) {
    setScanResult(null);
    processQrValue(value);
  }

  function handleImageError(msg: string) {
    setScanResult({ success: false, message: msg });
  }

  const checkInRate = stats ? Math.round((stats.checkedIn / (stats.total || 1)) * 100) : 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black">
          Check-In Command Center
        </h1>

        <Select
          label="Select Event"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          options={eventOptions}
          placeholder="Choose an event..."
          className="max-w-md"
        />

        {selectedEvent && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Users size={20} />} label="Total Registrations" value={stats.total || 0} color="bg-amber/10 text-amber" />
            <StatCard icon={<CheckCircle size={20} />} label="Checked In" value={stats.checkedIn || 0} color="bg-sage/10 text-sage" />
            <StatCard icon={<QrCode size={20} />} label="Remaining" value={(stats.total || 0) - (stats.checkedIn || 0)} color="bg-dusty-blue/10 text-dusty-blue" />
            <StatCard icon={<BarChart3 size={20} />} label="Check-in Rate" value={`${checkInRate}%`} color="bg-burgundy/10 text-burgundy" />
          </div>
        )}

        {selectedEvent && stats && (
          <Card hover={false} padding="lg">
            <h3 className="font-heading text-lg font-semibold text-near-black mb-3">
              Check-In Progress
            </h3>
            <Progress value={stats.checkedIn || 0} max={stats.total || 1} size="lg" showLabel />
          </Card>
        )}

        <Card hover={false} padding="lg" className="max-w-xl">
          <h3 className="font-heading text-lg font-semibold text-near-black mb-4">
            Quick Scan
          </h3>

          {/* Tabs */}
          <div className="flex rounded-xl border border-border-light overflow-hidden mb-5">
            <button
              onClick={() => { setTab("manual"); setScanResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-body text-sm transition-colors ${
                tab === "manual"
                  ? "bg-amber text-white font-semibold"
                  : "text-muted-gray hover:text-near-black hover:bg-cream/60"
              }`}
            >
              <Keyboard size={15} />
              Enter Code
            </button>
            <button
              onClick={() => { setTab("image"); setScanResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-body text-sm transition-colors ${
                tab === "image"
                  ? "bg-amber text-white font-semibold"
                  : "text-muted-gray hover:text-near-black hover:bg-cream/60"
              }`}
            >
              <ImageIcon size={15} />
              Upload Image
            </button>
          </div>

          {/* Manual entry */}
          {tab === "manual" && (
            <div className="flex gap-3 mb-4">
              <Input
                value={qrInput}
                onChange={(e) => { setQrInput(e.target.value); setScanResult(null); }}
                placeholder="Enter QR code..."
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
              />
              <Button onClick={handleScan} isLoading={isLoading}>
                <Search size={16} className="mr-1.5" />
                Scan
              </Button>
            </div>
          )}

          {/* Image upload */}
          {tab === "image" && (
            <div className="mb-4">
              <QRImageUpload
                onDetected={handleImageDetected}
                onError={handleImageError}
              />
            </div>
          )}

          {scanResult && (
            <div className={`mt-2 p-3 rounded-lg flex items-center gap-2 ${scanResult.success ? "bg-sage/10 text-sage" : "bg-burgundy/5 text-burgundy"}`}>
              {scanResult.success ? (
                <CheckCircle size={18} className="flex-shrink-0" />
              ) : (
                <QrCode size={18} className="flex-shrink-0" />
              )}
              <p className="font-body text-sm font-medium">{scanResult.message}</p>
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
