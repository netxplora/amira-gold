import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/upload";
import { toast } from "sonner";

type Props = {
  label?: string;
  bucket: string;
  folder: string;
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
};

export function ImageUpload({ label = "Image", bucket, folder, value, onChange, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadImage(bucket, folder, file);
      onChange(url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/40">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Upload className="h-5 w-5" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {value ? "Replace" : "Upload"}
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)} disabled={uploading}>
                <X className="mr-1.5 h-3.5 w-3.5" /> Remove
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">PNG, JPG, WEBP — max 5MB</p>
        </div>
      </div>
    </div>
  );
}
