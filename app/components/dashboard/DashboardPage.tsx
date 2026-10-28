"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, listApiRecords, unwrapApiData, type ApiRecord } from "../../../lib/api-client";
import beansImage from "../../images/image.png";
import brandImage from "../../images/ima.png";
import ProfileBadge from "./ProfileBadge";
import styles from "./DashboardPage.module.css";
type DashboardPageProps = { role: "admin" | "user" };
type IconName = "home" | "transactions" | "inventory" | "contacts" | "reports" | "activity" | "arrow" | "refresh";
type Metric = { label: string; key: string; format: "money" | "number" };
const metrics: Metric[] = [
  { label: "Total sales", key: "total_sales", format: "money" },
  { label: "Total purchases", key: "purchase_total", format: "money" },
  { label: "Total expenses", key: "total_expenses", format: "money" },
  { label: "Inventory items", key: "total_inventory_items", format: "number" },
  { label: "Pending orders", key: "pending_order_count", format: "number" },
  { label: "Low stock items", key: "low_stock_item_count", format: "number" },
];
dsjhjdhasjhwjhasjdhjhsdjahdjhsdjahdjhdasj
const navigation: { label: string; icon: IconName; href: string }[] = [
  { label: "Home", icon: "home", href: "" },
  { label: "Transactions", icon: "transactions", href: "/transactions" },
  { label: "Inventory", icon: "inventory", href: "/inventory" },
  { label: "Contacts", icon: "contacts", href: "/contacts" },
  { label: "Reports", icon: "reports", href: "/reports" },
];

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return `Rwf ${Number.isFinite(amount) ? amount.toLocaleString("en-RW", { maximumFractionDigits: 0 }) : "0"}`;
}
dashjhasdjhtashgsahdsjhghdasjhsd
function numberValue(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toLocaleString("en-RW") : "0";
}

function getNumber(record: ApiRecord | null, key: string) {
  const amount = Number(record?.[key] ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="4" rx="1"/><rect x="13.5" y="10.5" width="7" height="10" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/></>,
    transactions: <><path d="M4 7h15m0 0-3-3m3 3-3 3M20 17H5m0 0 3-3m-3 3 3 3"/></>,
    inventory: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.8 7.5 4.4 7.5-4.4M12 12.3V21"/></>,
    contacts: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20v-1.5a5.5 5.5 0 0 1 11 0V20M16 5.5a3 3 0 0 1 0 5.8m2 3.2a5 5 0 0 1 2.5 4.3V20"/></>,
    reports: <><path d="M5 20V11m7 9V4m7 16v-7"/><path d="M3 20.5h18"/></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4"/></>,
    arrow: <><path d="m7 17 10-10M7 7h10v10"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.8-2L20 12M4 12l2.6 5a7 7 0 0 0 11.8-2"/></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return "Date unavailable";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value.slice(0, 16) : new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

export default function DashboardPage({ role }: DashboardPageProps) {
  const base = `/dashboard/${role}`;
  const [summary, setSummary] = useState<ApiRecord | null>(null);
  const [orders, setOrders] = useState<ApiRecord[]>([]);
  const [loadError, setLoadError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setOrdersError("");
    const [dashboardResult, ordersResult] = await Promise.allSettled([
      apiRequest<unknown>("dashboard/"),
      apiRequest<unknown>("sales/orders/?page_size=10"),
    ]);

    if (dashboardResult.status === "fulfilled") {
      const data = unwrapApiData(dashboardResult.value);
      setSummary(data && typeof data === "object" ? data as ApiRecord : {});
    } else {
      setLoadError(dashboardResult.reason instanceof Error ? dashboardResult.reason.message : "Could not load dashboard summary.");
    }

    if (ordersResult.status === "fulfilled") {
      setOrders(listApiRecords(ordersResult.value).slice(0, 10));
    } else {
      setOrdersError(ordersResult.reason instanceof Error ? ordersResult.reason.message : "Could not load recent transactions.");
    }

    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const analysis = useMemo(() => {
    const values = [
      { label: "Sales", value: getNumber(summary, "total_sales"), color: "#765039" },
      { label: "Purchases", value: getNumber(summary, "purchase_total"), color: "#c79a62" },
      { label: "Expenses", value: getNumber(summary, "total_expenses"), color: "#b97965" },
    ];
    const max = Math.max(...values.map((item) => item.value), 1);
    return values.map((item) => ({ ...item, height: item.value > 0 ? Math.max(4, (item.value / max) * 100) : 0 }));
  }, [summary]);

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return orders;
    return orders.filter((order) => {
      const reference = String(order.order_number ?? order.id ?? order.reference ?? "");
      const status = String(order.status ?? "");
      return `${reference} ${status}`.toLowerCase().includes(normalizedQuery);
    });
  }, [orders, query]);

  const dateLabel = new Intl.DateTimeFormat("en-RW", { dateStyle: "medium" }).format(new Date());

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href={base} className={styles.brand} aria-label="Boards Cafe dashboard">
          <Image src={brandImage} alt="" width={32} height={32} />
          <strong>BOARDS</strong>
        </Link>
        <nav className={styles.navigation} aria-label="Main navigation">
          {navigation.map(({ label, icon, href }, index) => (
            <Link key={label} href={`${base}${href}`} aria-current={index === 0 ? "page" : undefined} className={`${styles.navLink} ${index === 0 ? styles.active : ""}`}>
              <Icon name={icon} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <ProfileBadge role={role} />
      </aside>

      <main className={styles.main} style={{ backgroundImage: `linear-gradient(rgba(249,244,236,.76),rgba(249,244,236,.84)),url("${beansImage.src}")` }}>
        <header className={styles.topbar}>
          <span className={styles.breadcrumb}>Home</span>
          <label className={styles.searchBox}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>
            <input type="search" aria-label="Filter recent transactions" placeholder="Search recent transactions…" value={query} onChange={(event) => setQuery(event.target.value)} />
            <kbd>{dateLabel}</kbd>
          </label>
          <button type="button" onClick={() => void loadDashboard()} disabled={loading} className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#d9cbbb] bg-[#fffaf3] px-2.5 text-[10px] font-semibold text-[#65472f] hover:bg-white disabled:opacity-60" aria-label="Refresh dashboard data">
            <Icon name="refresh" /> <span>{loading ? "Loading" : "Refresh"}</span>
          </button>
        </header>

        <div className={styles.content}>
          {loadError && <div role="alert" className="mb-3 rounded-md border border-[#ebc9c1] bg-[#fff2ef] px-3 py-2 text-xs text-[#8a4337]">Dashboard data could not load: {loadError}</div>}
          <div className={styles.workspaceGrid}>
            <section className={styles.metricsGrid} aria-label="Business summary from the API">
              {metrics.map((metric) => (
                <article key={metric.key} className={styles.metricCard}>
                  <span className={styles.metricLabel}><Icon name="activity" />{metric.label}</span>
                  <strong>{loading && !summary ? "—" : metric.format === "money" ? money(summary?.[metric.key]) : numberValue(summary?.[metric.key])}</strong>
                </article>
              ))}
            </section>

            <section className={`${styles.card} ${styles.transactionsCard}`} aria-label="Latest transactions">
              <div className={styles.cardHeading}>
                <h1>Latest Transactions</h1>
                <p>Latest sales returned by the backend</p>
              </div>
              {ordersError && <p role="alert" className="mt-3 rounded-md bg-[#fff2ef] p-2 text-[10px] leading-4 text-[#8a4337]">{ordersError}</p>}
              {!ordersError && visibleOrders.length === 0 && <p className="mt-8 text-center text-[10px] text-[#988a7e]">{loading ? "Loading transactions…" : query ? "No transactions match your search." : "No transactions found for this workspace."}</p>}
              {visibleOrders.length > 0 && (
                <ul className={styles.transactionList}>
                  {visibleOrders.map((order, index) => {
                    const id = String(order.order_number ?? order.id ?? order.reference ?? `sale-${index + 1}`);
                    const amount = order.total_amount ?? order.total ?? order.grand_total ?? order.amount ?? 0;
                    const status = String(order.status ?? "Sale").replaceAll("_", " ");
                    const date = formatDate(order.created_at ?? order.order_date ?? order.date);
                    return (
                      <li className={styles.transaction} key={id}>
                        <span className={styles.transactionArrow}><Icon name="arrow" /></span>
                        <span className={styles.transactionInfo}><strong title={`Sale #${id}`}>Sale #{id}</strong><small>{date}</small></span>
                        <span className={styles.transactionAmount}><strong>{money(amount)}</strong><small>{status}</small></span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className={`${styles.card} ${styles.chartCard}`} aria-label="Backend financial totals">
              <div className={styles.cardHeading}>
                <h2>Business Analysis — Live Totals</h2>
                <p>Relative sales, purchases and expenses returned by the dashboard API</p>
              </div>
              <div className={styles.chart} role="img" aria-label={`Financial totals: sales ${money(summary?.total_sales)}, purchases ${money(summary?.purchase_total)}, expenses ${money(summary?.total_expenses)}`}>
                <div className={styles.axisLabels}><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0</span></div>
                <div className={styles.chartGrid}><i/><i/><i/><i/><i/></div>
                <div className={styles.chartBars}>
                  {analysis.map((item) => <div className={styles.barColumn} key={item.label}><div className={styles.barTrack}><span className={styles.barFill} style={{ height: `${item.height}%`, backgroundColor: item.color }} /></div></div>)}
                </div>
              </div>
              <div className={styles.legend}>
                {analysis.map((item) => <span key={item.label}><i style={{ backgroundColor: item.color }} />{item.label}: {money(item.value)}</span>)}
              </div>
            </section>

            <section className={styles.summaryGrid} aria-label="Additional backend insights">
              <article className={`${styles.card} ${styles.summaryCard}`}>
                <div className={styles.summaryHeading}><h2>Inventory Overview</h2><span>LIVE API</span></div>
                <p>{loading && !summary ? "Loading inventory…" : `${numberValue(summary?.total_inventory_items)} items in the catalogue`}</p>
              </article>
              <article className={`${styles.card} ${styles.summaryCard}`}>
                <div className={styles.summaryHeading}><h2>Order Pipeline</h2><span>LIVE API</span></div>
                <p>{loading && !summary ? "Loading orders…" : `${numberValue(summary?.pending_order_count)} orders awaiting action`}</p>
              </article>
              <article className={`${styles.card} ${styles.summaryCard}`}>
                <div className={styles.summaryHeading}><h2>Data Sync</h2><span>BACKEND</span></div>
                <p>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-RW", { hour: "2-digit", minute: "2-digit" })}` : "Waiting for API data"}</p>
              </article>
            </section>
          </div>
          <footer className={styles.footer}>
            <span>© Boards Cafe Management System {new Date().getFullYear()}</span>
            <nav aria-label="Footer links"><a href="https://boards-cafe-api.onrender.com/api/v1/docs/" target="_blank" rel="noreferrer">API docs</a><span>·</span><span>{role === "admin" ? "Administrator" : "Team workspace"}</span></nav>
          </footer>
        </div>
      </main>
    </div>
  );
}
