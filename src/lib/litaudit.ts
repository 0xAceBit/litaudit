import { z } from "zod";

export const LITVM_RPC = "https://liteforge.rpc.caldera.xyz/http";
export const LITVM_EXPLORER = "https://liteforge.explorer.caldera.xyz";
export const LITVM_CHAIN_ID = "4441";
export const ONMI_TOKEN_API = "https://api.onmi.fun/api/tokens/getToken";

export const contractAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Enter a valid LitVM contract address");

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type RiskLevel = "high" | "medium" | "low" | "unknown";

export type Finding = {
  sev: Severity;
  msg: string;
};

export type TokenInfo = {
  codeSize: number;
  decimals: number;
  hasBlacklist: boolean;
  hasMint: boolean;
  hasOwner: boolean;
  hasPause: boolean;
  isContract: boolean;
  name: string | null;
  symbol: string | null;
  totalSupply: string | null;
};

export type GoPlusTokenData = Record<string, string | undefined>;

export type OnmiTokenData = {
  address: string;
  blockNumber?: number | string | null;
  blockTimestamp?: string | null;
  createdAt?: string | null;
  creatorAddress?: string | null;
  image?: string | null;
  marketCap?: string | number | null;
  name?: string | null;
  symbol?: string | null;
  txnHash?: string | null;
};

export type AuditResult = {
  address: string;
  analysis: {
    flags: Finding[];
    gpData: GoPlusTokenData | null;
    level: RiskLevel;
    onmiData: OnmiTokenData | null;
    score: number;
  };
  info: TokenInfo;
  scannedAt: string;
};

export const severityMeta: Record<Severity, { label: string; className: string }> = {
  critical: { label: "Critical", className: "border-audit-critical/40 bg-audit-critical/10 text-audit-critical" },
  high: { label: "High", className: "border-audit-high/40 bg-audit-high/10 text-audit-high" },
  medium: { label: "Medium", className: "border-audit-medium/40 bg-audit-medium/10 text-audit-medium" },
  low: { label: "Low", className: "border-audit-low/40 bg-audit-low/10 text-audit-low" },
  info: { label: "Info", className: "border-audit-info/40 bg-audit-info/10 text-audit-info" },
};

export const riskMeta: Record<RiskLevel, { label: string; className: string; meterClassName: string }> = {
  high: { label: "High risk", className: "border-audit-critical/40 bg-audit-critical/10 text-audit-critical", meterClassName: "bg-audit-critical" },
  medium: { label: "Medium risk", className: "border-audit-medium/40 bg-audit-medium/10 text-audit-medium", meterClassName: "bg-audit-medium" },
  low: { label: "Low risk", className: "border-audit-low/40 bg-audit-low/10 text-audit-low", meterClassName: "bg-audit-low" },
  unknown: { label: "Not a contract", className: "border-audit-info/40 bg-audit-info/10 text-audit-info", meterClassName: "bg-audit-info" },
};

export function shortAddress(address: string) {
  return `${address.slice(0, 10)}…${address.slice(-8)}`;
}