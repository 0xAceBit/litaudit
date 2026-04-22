import { createServerFn } from "@tanstack/react-start";

import {
  LITVM_CHAIN_ID,
  LITVM_RPC,
  ONMI_TOKEN_API,
  contractAddressSchema,
  type AuditResult,
  type Finding,
  type GoPlusTokenData,
  type OnmiTokenData,
  type RiskLevel,
  type TokenInfo,
} from "@/lib/litaudit";

const ERC20_SELECTORS = {
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  totalSupply: "0x18160ddd",
  owner: "0x8da5cb5b",
  decimals: "0x313ce567",
  mintFunc: "0x40c10f19",
  pauseFunc: "0x8456cb59",
  blacklist: "0x44337ea1",
};

type RawOnmiTokenData = OnmiTokenData & {
  uriData?: {
    image?: unknown;
  };
};

async function rpcCall(method: string, params: unknown[]) {
  const response = await fetch(LITVM_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  if (!response.ok) {
    throw new Error(`LitVM RPC returned ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || "LitVM RPC request failed");
  }
  return data.result as string;
}

function hexToInt(hex: string | null) {
  if (!hex || hex === "0x") return 0;
  return parseInt(hex, 16);
}

function decodeString(hex: string | null) {
  try {
    if (!hex || hex.length < 10) return null;
    const data = hex.slice(2);
    const offset = parseInt(data.slice(64, 128), 16) * 2;
    const length = parseInt(data.slice(offset, offset + 64), 16) * 2;
    const raw = data.slice(offset + 64, offset + 64 + length);
    let result = "";
    for (let i = 0; i < raw.length; i += 2) {
      result += String.fromCharCode(parseInt(raw.slice(i, i + 2), 16));
    }
    return result || null;
  } catch {
    return null;
  }
}

function decodeUint(hex: string | null) {
  if (!hex || hex === "0x") return null;
  return BigInt(`0x${hex.slice(2).slice(-64)}`).toString();
}

async function fetchTokenInfo(address: string): Promise<TokenInfo> {
  const calls = Object.entries(ERC20_SELECTORS).map(([key, selector]) =>
    rpcCall("eth_call", [{ to: address, data: selector }, "latest"])
      .then((result) => [key, result] as const)
      .catch(() => [key, null] as const),
  );

  const code = await rpcCall("eth_getCode", [address, "latest"]).catch(() => "0x");
  const results = await Promise.all(calls);
  const data = Object.fromEntries(results);

  return {
    codeSize: code ? (code.length - 2) / 2 : 0,
    decimals: data.decimals ? hexToInt(data.decimals) : 18,
    hasBlacklist: Boolean(data.blacklist && data.blacklist !== "0x"),
    hasMint: Boolean(data.mintFunc && data.mintFunc !== "0x"),
    hasOwner: Boolean(data.owner && data.owner !== `0x${"0".repeat(64)}`),
    hasPause: Boolean(data.pauseFunc && data.pauseFunc !== "0x"),
    isContract: Boolean(code && code !== "0x" && code.length > 4),
    name: decodeString(data.name),
    symbol: decodeString(data.symbol),
    totalSupply: decodeUint(data.totalSupply),
  };
}

async function tryGoPlusCheck(address: string) {
  try {
    const response = await fetch(
      `https://api.gopluslabs.io/api/v1/token_security/${LITVM_CHAIN_ID}?contract_addresses=${address.toLowerCase()}`,
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.code === 1 && data.result ? (data.result[address.toLowerCase()] ?? null) : null;
  } catch {
    return null;
  }
}

async function tryOnmiTokenData(address: string): Promise<OnmiTokenData | null> {
  try {
    const params = new URLSearchParams({ chainId: LITVM_CHAIN_ID, limit: "1", page: "1", search: address });
    const response = await fetch(`${ONMI_TOKEN_API}?${params.toString()}`);
    if (!response.ok) return null;
    const data = await response.json();
    const tokens = Array.isArray(data.token) ? data.token : [];
    const token = tokens.find((item: RawOnmiTokenData) => item.address?.toLowerCase() === address.toLowerCase()) as RawOnmiTokenData | undefined;
    if (!token) return null;
    return { ...token, image: safeImageUrl(token.image) ?? safeImageUrl(token.uriData?.image) };
  } catch {
    return null;
  }
}

function safeImageUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 500) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function analyzeRisk(info: TokenInfo, gpData: GoPlusTokenData | null, onmiData: OnmiTokenData | null) {
  const flags: Finding[] = [];
  let score = 0;

  if (!info.isContract) {
    return { score: 0, level: "unknown" as RiskLevel, flags: [{ sev: "info" as const, msg: "This address is not a contract — it appears to be a wallet." }], gpData: null, onmiData };
  }

  if (info.codeSize < 50) {
    flags.push({ sev: "high", msg: "Contract bytecode is suspiciously small and may be a proxy or minimal stub." });
    score += 25;
  }
  if (info.hasOwner) {
    flags.push({ sev: "medium", msg: "Owner function detected. The contract exposes privileged controller logic." });
    score += 15;
  }
  if (info.hasMint) {
    flags.push({ sev: "high", msg: "Mint function exists. Supply can potentially be expanded after launch." });
    score += 30;
  }
  if (info.hasPause) {
    flags.push({ sev: "medium", msg: "Pause function exists. Token activity may be frozen by privileged logic." });
    score += 20;
  }
  if (info.hasBlacklist) {
    flags.push({ sev: "high", msg: "Blacklist function detected. Specific wallets may be blocked from transfers." });
    score += 25;
  }

  if (gpData) {
    if (gpData.is_honeypot === "1") { flags.push({ sev: "critical", msg: "Honeypot signal detected. Selling may be restricted after buying." }); score += 60; }
    if (gpData.is_open_source === "0") { flags.push({ sev: "high", msg: "Source code is not verified, limiting independent review." }); score += 20; }
    if (gpData.is_proxy === "1") { flags.push({ sev: "medium", msg: "Proxy pattern detected. Contract logic may be upgradeable." }); score += 15; }
    if (gpData.can_take_back_ownership === "1") { flags.push({ sev: "high", msg: "Ownership can be reclaimed after renouncing." }); score += 35; }
    if (gpData.hidden_owner === "1") { flags.push({ sev: "critical", msg: "Hidden owner pattern detected." }); score += 40; }
    if (parseFloat(gpData.buy_tax || "0") > 10) { flags.push({ sev: "high", msg: `Buy tax is ${gpData.buy_tax}%, which is abnormally high.` }); score += 20; }
    if (parseFloat(gpData.sell_tax || "0") > 10) { flags.push({ sev: "critical", msg: `Sell tax is ${gpData.sell_tax}%, which may prevent profitable exits.` }); score += 30; }
    if (gpData.is_anti_whale === "1") { flags.push({ sev: "medium", msg: "Anti-whale logic may restrict large transfers or exits." }); score += 10; }
    if (gpData.trading_cooldown === "1") { flags.push({ sev: "medium", msg: "Trading cooldown may restrict sell timing." }); score += 10; }
    if (gpData.external_call === "1") { flags.push({ sev: "medium", msg: "External calls detected, increasing integration and reentrancy risk." }); score += 15; }
  }

  if (flags.length === 0) flags.push({ sev: "low", msg: "No obvious red flags detected by the automated scan." });

  score = Math.min(score, 100);
  const level: RiskLevel = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  return { score, level, flags, gpData, onmiData };
}

export const scanContract = createServerFn({ method: "POST" })
  .inputValidator((input) => ({ address: contractAddressSchema.parse((input as { address?: unknown }).address) }))
  .handler(async ({ data }): Promise<AuditResult> => {
    const info = await fetchTokenInfo(data.address);
    const [gpData, onmiData] = await Promise.all([tryGoPlusCheck(data.address), tryOnmiTokenData(data.address)]);
    const analysis = analyzeRisk(info, gpData, onmiData);
    return { address: data.address, analysis, info, scannedAt: new Date().toISOString() };
  });