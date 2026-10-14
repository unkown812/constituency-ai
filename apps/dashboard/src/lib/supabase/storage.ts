import { createClient } from "./client";

const COMPLAINTS_BUCKET = "complaints";
const AVATARS_BUCKET = "avatars";
const REPORTS_BUCKET = "reports";

function client() {
  return createClient();
}

export async function uploadImage(
  file: File,
  path: string
): Promise<string | null> {
  const { data } = await client()
    .storage
    .from(COMPLAINTS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (!data) return null;

  const { data: urlData } = await client()
    .storage
    .from(COMPLAINTS_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function uploadVoiceRecording(
  blob: Blob,
  userId: string,
  complaintId: string
): Promise<string | null> {
  const path = `${userId}/${complaintId}/voice.webm`;
  const { data } = await client()
    .storage
    .from(COMPLAINTS_BUCKET)
    .upload(path, blob, {
      contentType: "audio/webm",
      cacheControl: "3600",
      upsert: true,
    });

  if (!data) return null;

  const { data: urlData } = await client()
    .storage
    .from(COMPLAINTS_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function uploadDocument(
  file: File,
  userId: string,
  complaintId: string
): Promise<string | null> {
  const path = `${userId}/${complaintId}/documents/${file.name}`;
  const { data } = await client()
    .storage
    .from(COMPLAINTS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (!data) return null;

  const { data: urlData } = await client()
    .storage
    .from(COMPLAINTS_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function uploadAvatar(
  file: File,
  userId: string
): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/avatar.${ext}`;

  const { data } = await client()
    .storage
    .from(AVATARS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (!data) return null;

  const { data: urlData } = await client()
    .storage
    .from(AVATARS_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function uploadReport(
  blob: Blob,
  constituencyId: string,
  reportId: string
): Promise<string | null> {
  const path = `${constituencyId}/${reportId}.pdf`;
  const { data } = await client()
    .storage
    .from(REPORTS_BUCKET)
    .upload(path, blob, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: true,
    });

  if (!data) return null;

  const { data: urlData } = await client()
    .storage
    .from(REPORTS_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export function getComplaintsStorageUrl(path: string): string {
  const { data } = client()
    .storage
    .from(COMPLAINTS_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}

export function getAvatarUrl(path: string): string {
  const { data } = client()
    .storage
    .from(AVATARS_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}
