import { cookies } from "next/headers";
import { getPreviewProfiles } from "@/lib/data/profiles";
import { ProfilePreviewGrid } from "@/components/browse/ProfilePreviewGrid";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const cookieStore = await cookies();
  const intentCookie = cookieStore.get("dating_intent")?.value;

  const validIntents = ["FAITH", "CASUAL", "PROFESSIONAL"] as const;
  const intent = validIntents.includes(intentCookie as any) ? intentCookie : undefined;

  const profiles = await getPreviewProfiles({
    intent,
    limit: 24,
    randomize: true,
    blurSensitive: false,
  });

  return <ProfilePreviewGrid profiles={profiles} intent={intent} />;
}
