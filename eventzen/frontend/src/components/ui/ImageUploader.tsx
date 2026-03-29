import { useRef, useState } from "react";
import { Upload, X, Loader } from "lucide-react";
import { UPLOAD_URL } from "@/config/constants";
import { store } from "@/store/store";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
  label?: string;
  hint?: string;
}

async function compressAndUpload(file: File): Promise<string> {
  // Compress via canvas
  const blob = await new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 1200;
        let { width, height } = img;
        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
          "image/jpeg",
          0.78
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Upload to MinIO via venue-vendor-service
  const token = store.getState().auth.accessToken;
  const formData = new FormData();
  formData.append("file", blob, file.name.replace(/\.[^.]+$/, ".jpg"));

  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Upload failed");
  }

  const result = await res.json();
  return result.data.url as string;
}

export default function ImageUploader({
  images,
  onChange,
  max = 5,
  label = "Images",
  hint,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = max - images.length;
    const toProcess = Array.from(files).slice(0, remaining);
    setUploading(true);
    setUploadError("");
    try {
      const urls = await Promise.all(toProcess.map(compressAndUpload));
      onChange([...images, ...urls]);
    } catch (err: any) {
      setUploadError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-near-black font-body">
          {label}
          <span className="text-muted-gray font-normal ml-1">
            ({images.length}/{max})
          </span>
        </label>
      )}

      <div className="flex flex-wrap gap-3">
        {images.map((src, idx) => (
          <div
            key={idx}
            className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-border-light group"
          >
            <img src={src} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
            {idx === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-amber/80 text-white text-[10px] text-center py-0.5 font-body">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute top-1 right-1 w-5 h-5 bg-burgundy text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => !uploading && inputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-warm-tan hover:border-amber flex flex-col items-center justify-center gap-1 transition-colors text-muted-gray hover:text-amber disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader size={18} className="animate-spin" />
                <span className="font-body text-[11px]">Uploading</span>
              </>
            ) : (
              <>
                <Upload size={18} />
                <span className="font-body text-[11px]">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      {hint && <p className="font-body text-xs text-muted-gray">{hint}</p>}
      {uploadError && <p className="font-body text-xs text-burgundy">{uploadError}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
      />
    </div>
  );
}
