"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/simulations/stock-market", label: "Dashboard" },
  { href: "/simulations/stock-market/trade", label: "Trade" },
  { href: "/simulations/stock-market/portfolio", label: "Portfolio" },
  { href: "/simulations/stock-market/learn", label: "Learn" },
];

export default function StockMarketLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Top nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "#0f172a", borderBottom: "1px solid #1e293b",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "0 24px", display: "flex", alignItems: "center", height: 52,
        }}>
          {/* Brand */}
          <Link href="/simulations/stock-market" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, marginRight: 36 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 6,
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, flexShrink: 0,
            }}>📈</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
              Stock Market Academy
            </span>
          </Link>

          {/* Nav tabs */}
          <div style={{ display: "flex", gap: 4, flex: 1 }}>
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = href === "/simulations/stock-market"
                ? pathname === href
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#ffffff" : "#94a3b8",
                    background: isActive ? "#1e293b" : "transparent",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right: back link */}
          <Link
            href="/simulations"
            style={{ fontSize: 12, color: "#475569", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            ← Simulations
          </Link>
        </div>
      </nav>

      {children}
    </div>
  );
}
