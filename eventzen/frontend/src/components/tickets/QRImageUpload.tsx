import { useRef, useState } from "react";
import { Upload, ImageIcon, X } from "lucide-react";
import jsQR from "jsqr";

interface QRImageUploadProps {
  onDetected: (value: string) => void;
  onError?: (msg: string) => void;
}

function tryDecode(img: HTMLImageElement, scale: number, threshold?: number): string | null {
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = scale < 1; // nearest-neighbour when upscaling
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  if (threshold !== undefined) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const v = gray < threshold ? 0 : 255;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
  }
  return jsQR(imageData.data, w, h)?.data ?? null;
}

export default function QRImageUpload({ onDetected, onError }: QRImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function clearFile() {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function readQRFromFile(file: File) {
    setScanning(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setPreview(src);

      const img = new Image();
      img.onload = () => {
        // Try progressively: original → upscaled → threshold binarisation at multiple scales
        const strategies: Array<() => string | null> = [
          () => tryDecode(img, 1),
          () => tryDecode(img, 1, 128),
          () => tryDecode(img, 2, 128),
          () => tryDecode(img, 4, 128),
          () => tryDecode(img, 2, 100),
          () => tryDecode(img, 2, 160),
          () => tryDecode(img, 3, 128),
        ];
        let decoded: string | null = null;
        for (const attempt of strategies) {
          try { decoded = attempt(); } catch { /* ignore */ }
          if (decoded) break;
        }
        setScanning(false);
        if (decoded) {
          onDetected(decoded);
        } else {
          onError?.("No QR code found in this image. Try a clearer screenshot.");
        }
      };
      img.onerror = () => {
        setScanning(false);
        onError?.("Could not load image file.");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError?.("Please upload an image file.");
      return;
    }
    readQRFromFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError?.("Please upload an image file.");
      return;
    }
    readQRFromFile(file);
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border-light rounded-xl p-5 cursor-pointer hover:border-amber/60 hover:bg-amber/5 transition-colors group"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Uploaded"
              className="max-h-28 max-w-full rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-burgundy text-white flex items-center justify-center hover:bg-burgundy/80 transition-colors"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center group-hover:bg-amber/20 transition-colors">
              {scanning ? (
                <div className="w-4 h-4 border-2 border-amber border-t-transparent rounded-full animate-spin" />
              ) : (
                <ImageIcon size={18} className="text-amber" />
              )}
            </div>
            <div className="text-center">
              <p className="font-body text-sm font-medium text-near-black">
                {scanning ? "Reading QR code…" : "Upload image or screenshot"}
              </p>
              <p className="font-body text-xs text-muted-gray mt-0.5">
                Drag & drop or click to browse
              </p>
            </div>
          </>
        )}

        {fileName && !preview && (
          <p className="font-body text-xs text-muted-gray truncate max-w-full px-2">
            {fileName}
          </p>
        )}

        {scanning && preview && (
          <div className="flex items-center gap-1.5 font-body text-xs text-amber">
            <div className="w-3 h-3 border-2 border-amber border-t-transparent rounded-full animate-spin" />
            Detecting QR code…
          </div>
        )}
      </div>

      {/* Upload button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-border-light rounded-xl font-body text-sm text-dark-gray hover:text-amber hover:border-amber/50 hover:bg-amber/5 transition-colors"
      >
        <Upload size={15} />
        Choose Image File
      </button>
    </div>
  );
}
