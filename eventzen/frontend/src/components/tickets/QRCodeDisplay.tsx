import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCodeDisplay({
  value,
  size = 200,
  className = "",
}: QRCodeDisplayProps) {
  return (
    <div
      className={`inline-flex items-center justify-center p-4 bg-white border-2 border-border-light rounded-xl ${className}`}
    >
      <QRCodeSVG
        value={value}
        size={size}
        level="H"
        bgColor="#FFFFFF"
        fgColor="#1E1E1E"
      />
    </div>
  );
}
