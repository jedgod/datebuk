import api from "./api";

export type PrivateMediaKind = "image" | "video" | "audio";

type PresignResponse = {
  url: string;
  key: string;
  kind: PrivateMediaKind;
  maxBytes: number;
};

export async function uploadPrivateMedia(input: {
  uri: string;
  contentType: string;
  kind: PrivateMediaKind;
  fileName?: string;
}): Promise<{ key: string; contentType: string; sizeBytes: number }> {
  const source = await fetch(input.uri);
  if (!source.ok) throw new Error("Unable to read captured media");
  const blob = await source.blob();

  const presign = await api.post<PresignResponse>("/uploads/presign", {
    contentType: input.contentType,
    kind: input.kind,
    fileName: input.fileName,
    sizeBytes: blob.size,
  });

  if (blob.size > presign.data.maxBytes) throw new Error("Captured media is too large");

  const uploaded = await fetch(presign.data.url, {
    method: "PUT",
    headers: { "Content-Type": input.contentType },
    body: blob,
  });
  if (!uploaded.ok) throw new Error("Private media upload failed");

  const completed = await api.post<{
    key: string;
    contentType: string;
    sizeBytes: number;
  }>("/uploads/complete", { key: presign.data.key });
  return completed.data;
}

export async function getPrivateMediaUrl(key: string): Promise<string> {
  const response = await api.get<{ url: string }>("/uploads/access", { params: { key } });
  return response.data.url;
}
