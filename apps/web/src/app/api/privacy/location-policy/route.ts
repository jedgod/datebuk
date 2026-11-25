import { NextResponse } from "next/server";
import { getPrivacyPolicyRules } from "@/lib/server/geo-matching";

export async function GET() {
  try {
    return NextResponse.json(
      {
        title: "Location Privacy Policy",
        rules: getPrivacyPolicyRules(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Location policy error:", error);
    return NextResponse.json({ error: "Failed to fetch location policy" }, { status: 500 });
  }
}
