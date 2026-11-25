import { api } from "@/lib/api";

// Mirrors UpdateProfileDto on the API (apps/api/src/profiles/dto/update-profile.dto.ts).
const GENDER: Record<string, string> = {
  Man: "MALE",
  Woman: "FEMALE",
  "Non-binary": "NON_BINARY",
  "Prefer not to say": "PREFER_NOT_TO_SAY",
};

const SEEKING_ORDER = ["Men", "Women", "Everyone"] as const;

/** ["Men"] -> MEN, ["Women"] -> WOMEN, both or "Everyone" -> EVERYONE. */
export function toSeeking(selected: string[]): "MEN" | "WOMEN" | "EVERYONE" | undefined {
  const picked = SEEKING_ORDER.filter((o) => selected.includes(o));
  if (picked.length === 0) return undefined;
  if (picked.includes("Everyone") || picked.length > 1) return "EVERYONE";
  return picked[0] === "Men" ? "MEN" : "WOMEN";
}

/** `5'10"` -> 178 (cm). Undefined when it can't be parsed or is out of the API's 120-250 range. */
export function heightToCm(value: string): number | undefined {
  const m = /^(\d+)'(\d+)"?$/.exec((value || "").trim());
  if (!m) return undefined;
  const cm = Math.round((Number(m[1]) * 12 + Number(m[2])) * 2.54);
  return cm >= 120 && cm <= 250 ? cm : undefined;
}

export function toGender(label: string): string | undefined {
  return GENDER[label];
}

type PresignResponse = { url: string; key: string };

/**
 * Uploads the signup photos (data URLs picked in Step5ProfilePhoto) through the same
 * presign -> PUT -> complete flow the rest of the app uses, returning the completed keys.
 * A photo that fails is skipped (and counted) rather than aborting the whole signup.
 */
export async function uploadSignupPhotos(
  dataUrls: string[],
  token: string,
): Promise<{ keys: string[]; failed: number }> {
  const keys: string[] = [];
  let failed = 0;
  for (const dataUrl of dataUrls.slice(0, 6)) {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const contentType = ["image/jpeg", "image/png", "image/webp"].includes(blob.type) ? blob.type : "image/jpeg";
      const presign = await api.post<PresignResponse>(
        "/uploads/presign",
        { contentType, kind: "image", fileName: "profile-photo", sizeBytes: blob.size },
        token,
      );
      const put = await fetch(presign.url, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
      if (!put.ok) throw new Error(`upload failed (${put.status})`);
      await api.post("/uploads/complete", { key: presign.key }, token);
      keys.push(presign.key);
    } catch (err) {
      failed += 1;
      console.warn("Signup photo upload failed:", err);
    }
  }
  return { keys, failed };
}
