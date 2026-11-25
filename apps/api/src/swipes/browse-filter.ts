/**
 * Who a member is shown when browsing / discovering.
 *
 * Default: women browse men and men browse women. If the member said who they are looking for at
 * signup (`genderPreference`: MEN | WOMEN | EVERYONE) that explicit choice wins. Anyone whose gender
 * is non-binary / other / not stated, and who hasn't chosen, sees everyone.
 *
 * It is also mutual: a candidate who said they only want to see men/women isn't shown to someone
 * outside that. Members with no stated preference are open to everyone.
 */
export type Gender = "MALE" | "FEMALE" | "NON_BINARY" | "OTHER" | "PREFER_NOT_TO_SAY" | null | undefined;
export type Seeking = "MEN" | "WOMEN" | "EVERYONE" | null | undefined;

/** The gender to show this viewer, or null for "no gender restriction". */
export function targetGenderFor(viewer: { gender?: Gender; genderPreference?: Seeking }): "MALE" | "FEMALE" | null {
  if (viewer.genderPreference === "MEN") return "MALE";
  if (viewer.genderPreference === "WOMEN") return "FEMALE";
  if (viewer.genderPreference === "EVERYONE") return null;
  if (viewer.gender === "MALE") return "FEMALE";
  if (viewer.gender === "FEMALE") return "MALE";
  return null;
}

/** The `genderPreference` value a candidate would need to have to be interested in this viewer's gender. */
export function seekingValueFor(viewerGender: Gender): "MEN" | "WOMEN" | null {
  if (viewerGender === "MALE") return "MEN";
  if (viewerGender === "FEMALE") return "WOMEN";
  return null;
}

/** Prisma `where` fragments (AND-ed into the candidate query). Empty when nothing needs restricting. */
export function browseGenderWhere(viewer: { gender?: Gender; genderPreference?: Seeking }) {
  const parts: Record<string, unknown>[] = [];

  const target = targetGenderFor(viewer);
  if (target) parts.push({ gender: target });

  // Mutual interest: unset or "everyone" is open to all; otherwise the candidate must be seeking the viewer's gender.
  const seeking = seekingValueFor(viewer.gender);
  const open = [{ genderPreference: null }, { genderPreference: "EVERYONE" }];
  parts.push({ OR: seeking ? [...open, { genderPreference: seeking }] : open });

  return parts;
}
