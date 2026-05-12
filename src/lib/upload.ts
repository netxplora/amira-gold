import { supabase } from "@/integrations/supabase/client";

const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export type UploadResult = { url: string; path: string };

export async function uploadImage(
  bucket: string,
  folder: string,
  file: File,
): Promise<UploadResult> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Only PNG, JPG, or WEBP images are allowed");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Image must be 5MB or smaller");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "_");
  const path = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeImage(bucket: string, path: string) {
  await supabase.storage.from(bucket).remove([path]);
}

export function pathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
