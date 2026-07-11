"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const INK = "#0f172a", MUTED = "#64748b", FAINT = "#94a3b8";
const CARD = "#ffffff", BORDER = "#e2e8f0", BG = "#f8fafc";
const GAIN = "#16a34a", GAIN_BG = "#f0fdf4", GAIN_BORDER = "#bbf7d0";
const LOSS = "#dc2626", LOSS_BG = "#fef2f2", LOSS_BORDER = "#fecaca";

interface SearchResult {
  symbol: string;
  description: string;
}

interface QuoteData {
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  prevClose: number;
}

interface ProfileData {
  name: string;
  exchange: string;
  finnhubIndustry: string;
  logo: string;
  marketCapitalization: number;
}

interface FundamentalsData {
  peRatio: number | null;
  epsAnnual: number | null;
  grossMarginTTM: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

interface PortfolioData {
  cash: number;
  positions: { ticker: string; shares: number; avgCost: number }[];
}

const POPULAR = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "DIS", "NKE", "KO"];

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtMktCap(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}T`;
  if (n >= 1) return `$${n.toFixed(0)}B`;
  return `$${(n * 1000).toFixed(0)}M`;
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px" }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: FAINT, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: INK }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{sub}</p>}
    </div>
  );
}

function TradePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [ticker, setTicker] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fundamentals, setFundamentals] = useState<FundamentalsData | null>(null);
  const [stockLoading, setStockLoading] = useState(false);

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [sharesInput, setSharesInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [noApiKey, setNoApiKey] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const priceRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auth + portfolio load
  useEffect(() => {
    fetch("/api/stock-sim/portfolio")
      .then(r => {
        if (r.status === 401) { router.replace("/margins/login?next=/simulations/stock-market/trade"); return null; }
        return r.json();
      })
      .then(data => { if (data) setPortfolio(data); })
      .catch(() => {});
  }, [router]);

  // Pre-select ticker from query param (e.g. ?ticker=AAPL from a mission)
  useEffect(() => {
    const t = searchParams.get("ticker");
    if (t) selectTicker(t.toUpperCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) { setResults([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.error && data.error.includes("not configured")) { setNoApiKey(true); return; }
        setResults(data.results ?? []);
        setShowDropdown(true);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadStockData = useCallback(async (sym: string) => {
    const [qRes, pRes, fRes] = await Promise.all([
      fetch(`/api/stocks/quote?ticker=${sym}`),
      fetch(`/api/stocks/profile?ticker=${sym}`),
      fetch(`/api/stocks/fundamentals?ticker=${sym}`),
    ]);
    const [qData, pData, fData] = await Promise.all([qRes.json(), pRes.json(), fRes.json()]);
    if (qData.price) setQuote(qData);
    if (pData.profile) setProfile(pData.profile);
    if (fData.fundamentals) setFundamentals(fData.fundamentals);
  }, []);

  const selectTicker = useCallback(async (sym: string) => {
    setTicker(sym);
    setSearchQuery(sym);
    setShowDropdown(false);
    setQuote(null);
    setProfile(null);
    setFundamentals(null);
    setSharesInput("");
    setStockLoading(true);

    // Clear existing refresh interval
    if (priceRefreshRef.current) clearInterval(priceRefreshRef.current);

    try {
      await loadStockData(sym);
    } finally {
      setStockLoading(false);
    }

    // Refresh price every 20 seconds
    priceRefreshRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/stocks/quote?ticker=${sym}`);
        const data = await res.json();
        if (data.price) setQuote(data);
      } catch { /* ignore */ }
    }, 20_000);
  }, [loadStockData]);

  // Cleanup interval on unmount
  useEffect(() => () => { if (priceRefreshRef.current) clearInterval(priceRefreshRef.current); }, []);

  const currentPosition = portfolio?.positions.find(p => p.ticker === ticker);
  const estimatedCost = quote?.price && sharesInput ? parseFloat(sharesInput) * quote.price : 0;
  const canTrade = !!ticker && !!sharesInput && parseFloat(sharesInput) > 0 && !submitting && !!quote?.price;

  const handleTrade = async () => {
    if (!canTrade || !ticker) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/stock-sim/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, action, shares: parseFloat(sharesInput) }),
      });
      const data = await res.json();
      if (data.ok) {
        const word = action === "buy" ? "Bought" : "Sold";
        setToast({ msg: `${word} ${sharesInput} share${parseFloat(sharesInput) !== 1 ? "s" : ""} of ${ticker} at $${fmt(data.pricePerShare)}`, ok: true });
        setSharesInput("");
        // Refresh portfolio data
        fetch("/api/stock-sim/portfolio").then(r => r.json()).then(d => setPortfolio(d)).catch(() => {});
      } else {
        setToast({ msg: data.error ?? "Trade failed.", ok: false });
      }
    } catch {
      setToast({ msg: "Network error. Try again.", ok: false });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const isUp = (quote?.changePct ?? 0) >= 0;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 70, right: 24, zIndex: 100,
          background: toast.ok ? GAIN : LOSS,
          color: "#fff", borderRadius: 10, padding: "12px 18px",
          fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          maxWidth: 340,
        }}>
          {toast.ok ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      {noApiKey && (
        <div style={{
          background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 12,
          padding: "16px 20px", marginBottom: 24,
        }}>
          <p style={{ fontSize: 13, color: "#92400e", fontWeight: 600 }}>
            Finnhub API key not configured. Add FINNHUB_API_KEY to .env.local to enable live prices.
            Get a free key at <a href="https://finnhub.io" target="_blank" rel="noopener noreferrer" style={{ color: "#92400e" }}>finnhub.io</a>.
          </p>
        </div>
      )}

      {/* Search */}
      <div ref={searchRef} style={{ position: "relative", marginBottom: 28 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 12,
          padding: "12px 18px",
          boxShadow: showDropdown ? "0 0 0 3px #e2e8f0" : "none",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => { if (results.length) setShowDropdown(true); }}
            placeholder="Search for a company or ticker (e.g. Apple, NVDA)…"
            style={{
              flex: 1, border: "none", outline: "none", fontSize: 15,
              color: INK, background: "transparent", fontFamily: "inherit",
            }}
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setResults([]); setShowDropdown(false); setTicker(null); setQuote(null); setProfile(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: FAINT, fontSize: 18, padding: 0, lineHeight: 1 }}>
              ×
            </button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && results.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
            background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)", zIndex: 20, overflow: "hidden",
          }}>
            {results.map(r => (
              <button
                key={r.symbol}
                onClick={() => selectTicker(r.symbol)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "11px 18px", background: "none", border: "none",
                  borderBottom: `1px solid ${BORDER}`, cursor: "pointer", textAlign: "left",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = BG)}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{r.symbol}</span>
                <span style={{ fontSize: 12, color: MUTED, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.description}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular tickers (when nothing selected) */}
      {!ticker && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            Popular Stocks
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {POPULAR.map(sym => (
              <button
                key={sym}
                onClick={() => selectTicker(sym)}
                style={{
                  padding: "7px 14px", background: CARD, border: `1px solid ${BORDER}`,
                  borderRadius: 8, fontSize: 13, fontWeight: 700, color: INK,
                  cursor: "pointer", transition: "all 0.1s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.background = BG; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = CARD; }}
              >
                {sym}
              </button>
            ))}
          </div>
          {portfolio && portfolio.positions.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                Your Holdings
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {portfolio.positions.map(pos => (
                  <button
                    key={pos.ticker}
                    onClick={() => selectTicker(pos.ticker)}
                    style={{
                      padding: "7px 14px", background: GAIN_BG, border: `1px solid ${GAIN_BORDER}`,
                      borderRadius: 8, fontSize: 13, fontWeight: 700, color: GAIN,
                      cursor: "pointer",
                    }}
                  >
                    {pos.ticker} · {pos.shares} shares
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock selected: info + trade form */}
      {ticker && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 280px", gap: 20, alignItems: "start" }}>

          {/* Left: stock info */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "24px 24px 18px" }}>
              {profile ? (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                  {profile.logo && (
                    <img src={profile.logo} alt="" width={40} height={40}
                      style={{ borderRadius: 8, border: `1px solid ${BORDER}`, objectFit: "contain", flexShrink: 0 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, lineHeight: 1.2 }}>{profile.name}</h2>
                    <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, background: BG, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "2px 7px" }}>{ticker}</span>
                      {profile.exchange && <span style={{ fontSize: 11, color: FAINT, background: BG, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "2px 7px" }}>{profile.exchange}</span>}
                      {profile.finnhubIndustry && <span style={{ fontSize: 11, color: FAINT, background: BG, border: `1px solid ${BORDER}`, borderRadius: 4, padding: "2px 7px" }}>{profile.finnhubIndustry}</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: INK }}>{ticker}</h2>
                </div>
              )}

              {/* Price */}
              {stockLoading && !quote && (
                <p style={{ color: FAINT, fontSize: 14 }}>Loading price…</p>
              )}
              {quote && (
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontSize: 38, fontWeight: 800, color: INK, letterSpacing: "-0.03em", lineHeight: 1 }}>
                      ${fmt(quote.price)}
                    </span>
                    <span style={{
                      fontSize: 15, fontWeight: 600,
                      color: isUp ? GAIN : LOSS,
                      background: isUp ? GAIN_BG : LOSS_BG,
                      border: `1px solid ${isUp ? GAIN_BORDER : LOSS_BORDER}`,
                      borderRadius: 6, padding: "3px 9px",
                    }}>
                      {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{fmt(quote.change)} ({isUp ? "+" : ""}{quote.changePct.toFixed(2)}%)
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: FAINT, marginTop: 4 }}>
                    Day range: ${fmt(quote.low)} – ${fmt(quote.high)} · Prev close: ${fmt(quote.prevClose)}
                  </p>
                </div>
              )}
            </div>

            {/* Stats */}
            {(fundamentals || profile?.marketCapitalization) && (
              <div style={{ padding: "0 24px 24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {fundamentals?.peRatio != null && <StatBox label="P/E Ratio" value={fmt(fundamentals.peRatio, 1)} />}
                  {fundamentals?.epsAnnual != null && <StatBox label="EPS" value={`$${fmt(fundamentals.epsAnnual, 2)}`} />}
                  {fundamentals?.grossMarginTTM != null && <StatBox label="Gross Margin" value={`${fmt(fundamentals.grossMarginTTM, 1)}%`} />}
                  {profile?.marketCapitalization && <StatBox label="Market Cap" value={fmtMktCap(profile.marketCapitalization)} />}
                  {fundamentals?.fiftyTwoWeekHigh != null && fundamentals?.fiftyTwoWeekLow != null && (
                    <StatBox
                      label="52-Week Range"
                      value={`$${fmt(fundamentals.fiftyTwoWeekLow)} – $${fmt(fundamentals.fiftyTwoWeekHigh)}`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Current position */}
            <div style={{ margin: "0 24px", paddingTop: 16, borderTop: `1px solid ${BORDER}`, paddingBottom: 20 }}>
              {currentPosition ? (
                <p style={{ fontSize: 13, color: MUTED }}>
                  You hold{" "}
                  <strong style={{ color: INK }}>{currentPosition.shares} shares</strong>
                  {" "}at avg cost <strong style={{ color: INK }}>${fmt(currentPosition.avgCost)}</strong>
                </p>
              ) : (
                <p style={{ fontSize: 13, color: FAINT }}>You don't hold any shares of {ticker}.</p>
              )}
            </div>
          </div>

          {/* Right: trade form */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "24px", position: isMobile ? "static" : "sticky", top: 70 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
              Place Order
            </p>

            {/* Buy / Sell toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: BG, borderRadius: 9, padding: 3, marginBottom: 18 }}>
              {(["buy", "sell"] as const).map(a => (
                <button
                  key={a}
                  onClick={() => setAction(a)}
                  style={{
                    padding: "8px", borderRadius: 7, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 700,
                    background: action === a ? (a === "buy" ? GAIN : LOSS) : "transparent",
                    color: action === a ? "#fff" : MUTED,
                    transition: "all 0.15s",
                    textTransform: "capitalize",
                  }}
                >
                  {a}
                </button>
              ))}
            </div>

            {/* Shares input */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
                Shares
              </label>
              <input
                type="number"
                min="0.001"
                step="1"
                value={sharesInput}
                onChange={e => setSharesInput(e.target.value)}
                placeholder="0"
                style={{
                  width: "100%", padding: "10px 12px",
                  border: `1.5px solid ${sharesInput ? "#94a3b8" : BORDER}`,
                  borderRadius: 8, fontSize: 16, fontWeight: 700, color: INK,
                  background: "#fff", outline: "none", fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Estimate */}
            <div style={{ background: BG, borderRadius: 8, padding: "12px 14px", marginBottom: 18 }}>
              {estimatedCost > 0 && quote ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: MUTED }}>Est. {action === "buy" ? "cost" : "proceeds"}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: INK }}>${fmt(estimatedCost)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: MUTED }}>Price per share</span>
                    <span style={{ fontSize: 11, color: MUTED }}>${fmt(quote.price)}</span>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 12, color: FAINT, textAlign: "center" }}>Enter shares to see estimate</p>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleTrade}
              disabled={!canTrade}
              style={{
                width: "100%", padding: "12px",
                background: !canTrade ? BORDER : (action === "buy" ? GAIN : LOSS),
                color: !canTrade ? FAINT : "#fff",
                border: "none", borderRadius: 9,
                fontSize: 14, fontWeight: 700, cursor: canTrade ? "pointer" : "not-allowed",
                transition: "opacity 0.15s",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Processing…" : `${action === "buy" ? "Buy" : "Sell"} ${ticker}`}
            </button>

            {/* Account info */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: MUTED }}>Cash available</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: INK }}>
                  ${portfolio ? fmt(portfolio.cash) : "—"}
                </span>
              </div>
              {action === "sell" && currentPosition && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: MUTED }}>Shares available</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: INK }}>{currentPosition.shares}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TradePage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}><p style={{ color: "#94a3b8", fontSize: 14 }}>Loading…</p></div>}>
      <TradePageInner />
    </Suspense>
  );
}
