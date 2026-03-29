import { useState } from "react";
import { QrCode, CheckCircle, XCircle, Search, ImageIcon, Keyboard } from "lucide-react";
import { motion } from "framer-motion";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import QRImageUpload from "@/components/tickets/QRImageUpload";
import { useScanCheckInMutation } from "@/store/api/ticketApi";

type Tab = "manual" | "image";

export default function VendorCheckInPage() {
  const [tab, setTab] = useState<Tab>("manual");
  const [qrInput, setQrInput] = useState("");
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [scanCheckIn, { isLoading }] = useScanCheckInMutation();

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
              await scanCheckIn({ qrCodeData: code }).unwrap();
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
      const result = await scanCheckIn({ qrCodeData: trimmed }).unwrap();
      setScanResult({ success: true, message: result.message || "Check-in successful!" });
      setQrInput("");
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err?.data?.message || "Invalid QR code or already checked in.",
      });
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

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
            Check-In Scanner
          </h1>
          <p className="font-body text-dark-gray">
            Scan attendee QR codes for event check-in
          </p>
        </div>

        {/* Scanner */}
        <Card hover={false} padding="lg" className="max-w-xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-amber/10 rounded-full flex items-center justify-center">
              <QrCode size={36} className="text-amber" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-near-black">
              Scan QR Code
            </h2>
            <p className="font-body text-sm text-muted-gray mt-1">
              Enter QR data manually or upload a ticket screenshot
            </p>
          </div>

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
                onChange={(e) => {
                  setQrInput(e.target.value);
                  setScanResult(null);
                }}
                placeholder="Enter QR code data..."
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
              />
              <Button onClick={handleScan} isLoading={isLoading} className="gap-2 flex-shrink-0">
                <Search size={18} />
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

          {/* Result */}
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 p-4 rounded-lg ${
                scanResult.success
                  ? "bg-sage/10 border border-sage/20"
                  : "bg-burgundy/5 border border-burgundy/20"
              }`}
            >
              {scanResult.success ? (
                <CheckCircle size={24} className="text-sage flex-shrink-0" />
              ) : (
                <XCircle size={24} className="text-burgundy flex-shrink-0" />
              )}
              <p
                className={`font-body text-sm font-medium ${
                  scanResult.success ? "text-sage" : "text-burgundy"
                }`}
              >
                {scanResult.message}
              </p>
            </motion.div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
