import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Clock3, ExternalLink, Info, Radar, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LITVM_EXPLORER, contractAddressSchema, riskMeta, severityMeta, shortAddress, type AuditResult, type RiskLevel } from "@/lib/litaudit";
import { scanContract } from "@/lib/litaudit.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LitAudit — LitVM Token Contract Scanner" },
      { name: "description", content: "Scan LitVM testnet token contracts for honeypots, privileged functions, token taxes, and rugpull risk signals." },
      { property: "og:title", content: "LitAudit — LitVM Token Contract Scanner" },
      { property: "og:description", content: "Automated token risk analysis for contracts deployed on the LitVM testnet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const scan = useServerFn(scanContract);
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<Array<{ address: string; level: RiskLevel }>>([]);

  const normalizedAddress = useMemo(() => normalizeAddressInput(address), [address]);
  const parsedAddress = useMemo(() => contractAddressSchema.safeParse(normalizedAddress), [normalizedAddress]);
  const canScan = normalizedAddress.length > 0 && !loading;
  const level = result ? riskMeta[result.analysis.level] : null;

  async function handleScan() {
    const parsed = contractAddressSchema.safeParse(normalizedAddress);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid contract address");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const next = await scan({ data: { address: parsed.data } });
      setResult(next);
      setRecent((items) => [{ address: next.address, level: next.analysis.level }, ...items.filter((item) => item.address !== next.address)].slice(0, 5));
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Scan failed. Check the network and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="border-b border-border/70 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary shadow-[var(--shadow-signal)]">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-bold leading-tight tracking-normal text-primary">LitAudit</p>
              <p className="text-xs font-semibold text-muted-foreground">Security Intelligence for LitVM</p>
            </div>
          </div>
          <a className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground transition-colors hover:bg-accent" href={LITVM_EXPLORER} target="_blank" rel="noreferrer">
            Explorer <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </div>
      </header>

      <section className="relative border-b border-border/70 bg-[radial-gradient(ellipse_at_top,var(--scanner-glow),transparent_60%)]">
        <div className="mx-auto flex min-h-[calc(100vh-82px)] max-w-7xl flex-col items-center px-6 py-24 text-center sm:px-8 lg:py-28">
          <div className="mx-auto max-w-5xl">
            <Badge className="mb-7 rounded-full border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase text-primary hover:bg-primary/10">
              LitVM Testnet · Chain 4441
            </Badge>
            <h1 className="mx-auto max-w-3xl text-5xl font-black leading-[1.04] tracking-normal text-foreground sm:text-6xl lg:text-7xl">
              Token security, <span className="bg-gradient-to-r from-primary via-audit-info to-audit-medium bg-clip-text text-transparent">redefined.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-base font-medium leading-8 text-muted-foreground sm:text-lg">
              Advanced contract analysis for the LitVM ecosystem. Detect honeypots, rugpull vectors, and hidden vulnerabilities before they cost you.
            </p>

            <div className="mx-auto mt-12 max-w-5xl rounded-xl border border-border bg-card/95 p-3 shadow-[var(--shadow-panel)]">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    value={address}
                    onChange={(event) => setAddress(normalizeAddressInput(event.target.value))}
                    onKeyDown={(event) => event.key === "Enter" && handleScan()}
                    placeholder="Enter contract address"
                    spellCheck={false}
                    className="h-14 border-0 bg-secondary pl-14 text-left font-mono text-sm font-semibold shadow-none focus-visible:ring-1 focus-visible:ring-primary"
                    aria-label="LitVM contract address"
                  />
                </div>
                <Button className="h-14 rounded-md px-7 text-sm font-black" disabled={!canScan} onClick={handleScan}>
                  {loading ? "Analyzing" : "Scan Contract"}
                  {loading ? <Radar className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
                </Button>
              </div>
              {error && <p className="mt-3 px-1 text-sm font-medium text-destructive">{error}</p>}
              {normalizedAddress && !parsedAddress.success && !error && <p className="mt-3 px-1 text-sm text-muted-foreground">Use a 42-character address beginning with 0x.</p>}
            </div>
          </div>

          <div className="mt-12 w-full max-w-5xl rounded-lg border border-border bg-card p-5 text-left shadow-[var(--shadow-panel)] lg:p-6">
            {!result ? (
              <div className="flex min-h-[420px] flex-col justify-between gap-8">
                <div>
                  <div className="mb-6 flex size-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                    <ShieldCheck className="size-6" aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-normal">Ready for first scan</h2>
                  <p className="mt-3 leading-7 text-muted-foreground">Paste a LitVM token contract address to inspect ERC-20 metadata, bytecode, ownership controls, and available external security signals.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {[
                    ["Controls", "owner · mint · pause"],
                    ["Market risk", "tax · honeypot · cooldown"],
                    ["Code state", "bytecode · proxy · source"],
                  ].map(([title, copy]) => (
                    <div key={title} className="rounded-md border border-border bg-secondary p-4">
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <AuditPanel result={result} levelClassName={level?.className ?? ""} meterClassName={level?.meterClassName ?? ""} />
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_1fr_1fr]">
        <InfoCard icon={<ShieldCheck className="size-5" />} title="Automated risk scoring" copy="Weighted findings surface critical, high, medium, and low signals with an actionable score." />
        <InfoCard icon={<Search className="size-5" />} title="Live LitVM reads" copy="Contract metadata and bytecode are fetched from the LitVM testnet RPC through server-side analysis." />
        <InfoCard icon={<Radar className="size-5" />} title="Scan history" copy="Recent scans stay ready in this session so you can compare contracts quickly." />
      </section>

      {recent.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">Recent scans</h2>
          <div className="flex flex-wrap gap-3">
            {recent.map((item) => {
              const meta = riskMeta[item.level];
              return (
                <button key={item.address} onClick={() => setAddress(item.address)} className="inline-flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent">
                  <span className={cn("size-2 rounded-full", meta.meterClassName)} />
                  <span className="font-mono text-sm">{shortAddress(item.address)}</span>
                  <span className={cn("rounded border px-2 py-0.5 text-xs font-semibold", meta.className)}>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

function AuditPanel({ result, levelClassName, meterClassName }: { result: AuditResult; levelClassName: string; meterClassName: string }) {
  const onmi = result.analysis.onmiData;
  const creationTime = formatCreationTime(onmi?.blockTimestamp, onmi?.createdAt);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Contract address</p>
          <p className="mt-2 font-mono text-sm text-foreground">{shortAddress(result.address)}</p>
          {(result.info.symbol || result.info.name) && <p className="mt-2 text-lg font-bold">{result.info.symbol ?? "Token"} <span className="text-sm font-medium text-muted-foreground">{result.info.name}</span></p>}
        </div>
        <a className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium hover:bg-accent" href={`${LITVM_EXPLORER}/address/${result.address}`} target="_blank" rel="noreferrer">
          View <ExternalLink className="size-4" />
        </a>
      </div>

      <div className="mt-8 rounded-lg border border-border bg-secondary p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">Security score</p>
          <span className={cn("rounded-md border px-3 py-1 text-xs font-bold uppercase", levelClassName)}>{riskMeta[result.analysis.level].label}</span>
        </div>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-6xl font-black leading-none">{result.analysis.score}</span>
          <span className="pb-2 text-2xl font-bold text-muted-foreground">/100</span>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full transition-all", meterClassName)} style={{ width: `${result.analysis.score}%` }} />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">Security findings</h2>
        <div className="space-y-3">
          {result.analysis.flags.map((finding, index) => {
            const meta = severityMeta[finding.sev];
            return (
              <div key={`${finding.sev}-${index}`} className="rounded-md border border-border bg-secondary p-4">
                <span className={cn("mb-2 inline-flex rounded border px-2 py-0.5 text-xs font-bold uppercase", meta.className)}>{meta.label}</span>
                <p className="text-sm leading-6 text-foreground/90">{finding.msg}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {[
          ["Created", creationTime],
          ["Bytecode", `${result.info.codeSize} bytes`],
          ["Decimals", String(result.info.decimals)],
          ["Owner", result.info.hasOwner ? "Detected" : "None"],
          ["Mint", result.info.hasMint ? "Present" : "None"],
          ["Pause", result.info.hasPause ? "Present" : "None"],
          ["Blacklist", result.info.hasBlacklist ? "Present" : "None"],
          ["Onmi market cap", onmi?.marketCap ? `$${onmi.marketCap}` : "Not listed"],
          ["Creator", onmi?.creatorAddress ? shortAddress(onmi.creatorAddress) : "Unknown"],
          ["Buy tax", `${result.analysis.gpData?.buy_tax ?? "0"}%`],
          ["Sell tax", `${result.analysis.gpData?.sell_tax ?? "0"}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-border bg-secondary p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3 rounded-md border border-border bg-secondary p-4 text-sm leading-6 text-muted-foreground">
        <Clock3 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>{onmi ? `Onmi launch data matched this token${onmi.txnHash ? ` from creation transaction ${shortAddress(onmi.txnHash)}.` : "."}` : "No matching Onmi launch record was found for this address yet."}</p>
      </div>

      <div className="mt-6 flex gap-3 rounded-md border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>This automated scan is not a formal audit. Treat it as a first-pass risk screen before deeper review.</p>
      </div>
    </div>
  );
}

function formatCreationTime(blockTimestamp?: string | null, createdAt?: string | null) {
  const date = blockTimestamp ? new Date(Number(blockTimestamp) * 1000) : createdAt ? new Date(createdAt) : null;
  if (!date || Number.isNaN(date.getTime())) return "Not listed";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function normalizeAddressInput(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function InfoCard({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex size-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">{icon}</div>
      <h2 className="text-lg font-bold tracking-normal">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
    </div>
  );
}