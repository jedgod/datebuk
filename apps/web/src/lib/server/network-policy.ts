import { NextRequest } from "next/server";
import { getEnforcementAction } from "@/lib/security/vpn-detection";
import { getAuthContext } from "@/lib/server/auth";
import { apiEndpoint } from "@/lib/config";

type NetworkSnapshot = {
  ipAddress: string;
  maskedIp: string;
  isp: string;
  flags: string[];
  riskScore: number;
  isVPN: boolean;
  action: "allow" | "warn" | "restrict" | "block";
  message: string;
  restrictions: string[];
};

interface IpIntelligenceData {
  isVpn: boolean;
  isProxy: boolean;
  isDatacenter: boolean;
  isp?: string;
  lookupFailed: boolean;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

function maskIp(ip: string): string {
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length !== 4) return "unknown";
    return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  }

  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 3).join(":")}:xxxx`;
  }

  return "unknown";
}

function isPrivateOrLocalIp(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("fd")
  );
}

export async function evaluateNetworkPolicy(req: NextRequest): Promise<NetworkSnapshot> {
  const ipAddress = getClientIp(req);
  const maskedIp = maskIp(ipAddress);

  if (isPrivateOrLocalIp(ipAddress)) {
    const allow = getEnforcementAction(0);
    return {
      ipAddress,
      maskedIp,
      isp: "local-network",
      flags: [],
      riskScore: 0,
      isVPN: false,
      action: allow.action,
      message: allow.message,
      restrictions: allow.restrictions,
    };
  }

  const flags: string[] = [];
  let riskScore = 0;
  let isVPN = false;
  let isp = "unknown";

  // Delegates to the same real IpIntelligenceService (ipapi.is) the auth flow uses for
  // registration/login VPN blocking, rather than re-deriving VPN status from an ISP-name
  // substring match against a public unauthenticated lookup — this call site used to be
  // its own separate, weaker heuristic hitting ipapi.co directly.
  try {
    const { token } = getAuthContext(req);
    const res = await fetch(apiEndpoint(`/security/ip-intel/for-ip?ip=${encodeURIComponent(ipAddress)}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });

    if (res.ok) {
      const data = (await res.json()) as IpIntelligenceData;
      isp = data.isp || "unknown";

      if (data.lookupFailed) {
        flags.push("IP_LOOKUP_FAILED");
        riskScore += 15;
      } else {
        isVPN = data.isVpn || data.isProxy;
        if (isVPN) {
          flags.push("VPN_DETECTED");
          riskScore += 55;
        }
        if (data.isDatacenter) {
          flags.push("DATACENTER_NETWORK");
          riskScore += 35;
        }
      }
    } else {
      flags.push("IP_LOOKUP_FAILED");
      riskScore += 15;
    }
  } catch {
    flags.push("IP_LOOKUP_FAILED");
    riskScore += 15;
  }

  const action = getEnforcementAction(Math.min(riskScore, 100));

  return {
    ipAddress,
    maskedIp,
    isp,
    flags,
    riskScore: Math.min(riskScore, 100),
    isVPN,
    action: action.action,
    message: action.message,
    restrictions: action.restrictions,
  };
}
