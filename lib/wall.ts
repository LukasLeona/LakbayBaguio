import type { SupabaseClient } from "@supabase/supabase-js";

export const WALL_BUCKET = "wall-media";
export const WALL_POST_LIMIT = 1500;
export const WALL_MAX_PHOTOS = 5;
export const WALL_MAX_SOURCE_BYTES = 12 * 1024 * 1024;
export const WALL_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type WallSort = "recent" | "loved";
export type WallReportReason = "spam" | "harassment" | "unsafe" | "private_information" | "other";

export type WallPost = {
  id: string;
  body: string;
  photo_paths: string[];
  created_at: string;
  reaction_count: number;
  has_reacted: boolean;
  is_owner: boolean;
};

export type PreparedWallPhoto = {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  extension: "webp" | "jpg";
};

export const previewWallPosts: WallPost[] = [
  {
    id: "preview-wall-1",
    body: "Baguio felt extra gentle today. I had coffee alone, watched the fog roll past Session Road, and somehow that was enough.",
    photo_paths: [],
    created_at: new Date(Date.now() - 12 * 60_000).toISOString(),
    reaction_count: 28,
    has_reacted: false,
    is_owner: false,
  },
  {
    id: "preview-wall-2",
    body: "To the stranger who returned my wallet near Burnham Park—salamat. You saved my whole trip. 🌲",
    photo_paths: [],
    created_at: new Date(Date.now() - 46 * 60_000).toISOString(),
    reaction_count: 64,
    has_reacted: true,
    is_owner: false,
  },
  {
    id: "preview-wall-3",
    body: "First solo trip. Medyo scary, medyo lonely, pero proud ako na tinuloy ko pa rin.",
    photo_paths: [],
    created_at: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
    reaction_count: 41,
    has_reacted: false,
    is_owner: true,
  },
];

export function wallRelativeTime(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(value));
}

export function wallPhotoPublicUrl(client: SupabaseClient, path: string) {
  return client.storage.from(WALL_BUCKET).getPublicUrl(path).data.publicUrl;
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The photo could not be prepared."))),
      type,
      quality,
    );
  });
}

export async function prepareWallPhoto(file: File): Promise<PreparedWallPhoto> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a JPG, PNG, or WebP photo.");
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) throw new Error("Choose a JPG, PNG, or WebP photo.");
  if (file.size > WALL_MAX_SOURCE_BYTES) throw new Error("That photo is too large. Choose one under 12 MB.");

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const longestSide = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, 1600 / longestSide);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    bitmap.close();
    throw new Error("This browser could not prepare the photo.");
  }
  context.fillStyle = "#fffdf5";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await canvasBlob(canvas, "image/webp", .84);
  let extension: PreparedWallPhoto["extension"] = "webp";
  if (blob.type !== "image/webp") {
    blob = await canvasBlob(canvas, "image/jpeg", .84);
    extension = "jpg";
  }
  if (blob.size > WALL_MAX_UPLOAD_BYTES) {
    blob = await canvasBlob(canvas, extension === "webp" ? "image/webp" : "image/jpeg", 0.68);
  }
  if (blob.size > WALL_MAX_UPLOAD_BYTES) throw new Error("The prepared photo is still too large. Try a smaller image.");

  return { blob, previewUrl: URL.createObjectURL(blob), width, height, extension };
}

export async function uploadWallPhoto(client: SupabaseClient, userId: string, photo: PreparedWallPhoto) {
  const path = `${userId}/${crypto.randomUUID()}.${photo.extension}`;
  const { error } = await client.storage.from(WALL_BUCKET).upload(path, photo.blob, {
    cacheControl: "31536000",
    contentType: photo.blob.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function removeWallPhotos(client: SupabaseClient, paths: string[]) {
  if (!paths.length) return;
  const { error } = await client.storage.from(WALL_BUCKET).remove(paths);
  if (error) throw error;
}

export function wallErrorMessage(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === "object" && error && "message" in error
      ? String(error.message)
      : "Something went wrong.";
  if (message.includes("Wall post limit reached")) return "You’ve shared five posts this hour. Give the wall a quick breather, then try again.";
  if (message.includes("Photo post limit reached")) return "You’ve shared two photo posts this hour. Text posts are still welcome, or try another album later.";
  if (message.includes("up to five photos")) return "Choose up to five photos for each Wall post.";
  if (message.toLowerCase().includes("captcha") || message.includes("Anonymous sign-in")) return "Complete the private security check, then try again.";
  if (message.includes("row-level security")) return "The photo could not be uploaded securely. Please refresh and try again.";
  return message;
}

export async function withWallTimeout<T>(request: PromiseLike<T>, milliseconds = 15_000) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(request),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("The wall took too long to respond.")), milliseconds);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
