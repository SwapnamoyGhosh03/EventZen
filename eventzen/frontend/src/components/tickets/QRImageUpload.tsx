import { useRef, useState } from "react";
import { Upload, ImageIcon, X } from "lucide-react";
import jsQR from "jsqr";

interface QRImageUploadProps {
  onDetected: (value: string) => void;
  onError?: (msg: string) => void;
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
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setScanning(false);
          onError?.("Could not process image.");
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height);
        setScanning(false);
        if (result?.data) {
          onDetected(result.data);
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
