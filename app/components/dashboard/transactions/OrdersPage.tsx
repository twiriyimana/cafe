"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { boardsApi, getAccessToken, listApiRecords, type ApiRecord } from "../../../../lib/api-client";
import {
  actionButtonClassName,
  deleteButtonClassName,
  fieldClassName,
  formatTransactionMoney,
  labelClassName,
  TransactionDialog,
  TransactionLayout,
  type TransactionRole,
} from "./TransactionLayout";

type OrderItem = { product: string; quantity: number; price: number };
type Order = {
  id: number;
  date: string;
  reference: string;
  customer: string;
  items: OrderItem[];
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  notes: string;
};

const emptyItem = { product: "", quantity: "1", price: "" };

export default function OrdersPage({ role }: { role: TransactionRole }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [item, setItem] = useState(emptyItem);
  const [status, setStatus] = useState<Order["status"]>("Pending");
  const [apiMode, setApiMode] = useState(false);
  const [products, setProducts] = useState<ApiRecord[]>([]);
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadFromApi() {
    if (!getAccessToken()) return;
    try {
      const [orderPayload, productPayload] = await Promise.all([boardsApi.orders(), boardsApi.menuProducts()]);
      const productRows = listApiRecords(productPayload);
      setProducts(productRows);
      setOrders(listApiRecords(orderPayload).map((r) => ({
        id: Number(r.id), date: String(r.created_at ?? "").slice(0, 10), reference: String(r.order_number ?? `ORD-${r.id}`), customer: "Walk-in customer",
        items: Array.isArray(r.items) ? (r.items as ApiRecord[]).map((it) => ({ product: String(it.product_name ?? "Product"), quantity: Number(it.quantity ?? 1), price: Number(it.unit_price ?? 0) })) : [],
        status: String(r.status ?? "pending").toLowerCase() === "paid" ? "Completed" : String(r.status ?? "pending").toLowerCase() === "cancelled" ? "Cancelled" : String(r.status ?? "pending").toLowerCase() === "draft" ? "Pending" : "Confirmed",
        notes: String(r.notes ?? ""),
      })));
      setApiMode(true); setApiError("");
    } catch (e) { setApiError(e instanceof Error ? e.message : "Could not load orders from API."); }
  }
  useEffect(() => { void loadFromApi(); }, []);

  const visible = orders.filter((order) => JSON.stringify(order).toLowerCase().includes(search.toLowerCase()));
  const total = useMemo(() => items.reduce((sum, row) => sum + row.quantity * row.price, 0), [items]);

  function closeForm() {
    setEditing(null); setIsFormOpen(false); setItems([]); setItem(emptyItem); setStatus("Pending");
  }
  function openCreateForm() { closeForm(); setIsFormOpen(true); }
  function openEditForm(order: Order) { setEditing(order); setItems(order.items); setStatus(order.status); setItem(emptyItem); setIsFormOpen(true); }
  function addItem() {
    const quantity = Number(item.quantity); const price = Number(item.price);
    if (!item.product.trim() || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0) return;
    setItems((current) => [...current, { product: item.product.trim(), quantity, price }]); setItem(emptyItem);
  }
  function saveOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;
    const form = new FormData(event.currentTarget); const id = editing?.id ?? Date.now();
    const order: Order = { id, date: String(form.get("date") || ""), reference: String(form.get("reference") || `ORD-${id}`), customer: String(form.get("customer") || ""), items, status, notes: String(form.get("notes") || "") };
    void (async () => {
      setBusy(true); setApiError("");
      try {
        if (apiMode) {
          const apiItems = items.map((row) => {
            const match = products.find((p) => String(p.name ?? "").toLowerCase() === row.product.toLowerCase());
            if (!match?.id) throw new Error(`Product "${row.product}" was not found in the API menu. Add/select an existing menu product first.`);
            return { product: Number(match.id), quantity: row.quantity };
          });
          const body = { items: apiItems, notes: order.notes };
          if (editing) await boardsApi.updateOrder(editing.id, body); else await boardsApi.createOrder(body);
          await loadFromApi();
        } else setOrders((current) => editing ? current.map((row) => row.id === id ? order : row) : [order, ...current]);
        closeForm();
      } catch (e) { setApiError(e instanceof Error ? e.message : "Could not save order."); }
      finally { setBusy(false); }
    })();
  }

  return (
    <TransactionLayout role={role} title="Orders" search={search} onSearchChange={setSearch} createLabel="Create New" onCreate={openCreateForm}>
      <section className="relative z-10 flex min-h-0 flex-1 flex-col gap-3 px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
        {apiError && <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-900">{apiError}</div>}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#e5dacd] bg-[#fcf9f4]/95 shadow-[0_2px_10px_rgba(72,48,30,0.04)]">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead className="sticky top-0 bg-[#f0e5d4] text-[9px] font-medium text-[#4b3b2f]"><tr className="h-8 border-b border-[#e2d6c6]">
                <th className="w-8 px-2.5"><input type="checkbox" aria-label="Select all orders" className="h-3 w-3 accent-[#805336]" /></th>
                {['Date','Reference#','Customer','Items','Total','Status'].map((heading) => <th key={heading} className="whitespace-nowrap px-2.5"><span className="inline-flex gap-1">{heading}<span>↕</span></span></th>)}
                <th className="px-2.5 text-right">Actions</th>
              </tr></thead>
              <tbody className="text-[10px] text-[#55463a]">
                {visible.map((order) => <tr key={order.id} className="h-9 border-b border-[#eee6dc]">
                  <td className="px-2.5"><input type="checkbox" aria-label={`Select order ${order.reference}`} className="h-3 w-3 accent-[#805336]" /></td>
                  <td className="whitespace-nowrap px-2.5">{order.date}</td><td className="px-2.5 font-medium">{order.reference}</td><td className="px-2.5">{order.customer}</td>
                  <td className="px-2.5">{order.items.map((row) => row.product).join(', ')}</td><td className="whitespace-nowrap px-2.5 font-medium">{formatTransactionMoney(order.items.reduce((s, row) => s + row.quantity * row.price, 0))}</td>
                  <td className="px-2.5">{order.status}</td><td className="px-2.5 text-right"><div className="inline-flex gap-1"><button type="button" onClick={() => openEditForm(order)} className={actionButtonClassName}>Edit</button><button type="button" onClick={() => { void (async () => { if (!window.confirm(`Delete order ${order.reference}?`)) return; try { if (apiMode) await boardsApi.deleteOrder(order.id); setOrders((current) => current.filter((row) => row.id !== order.id)); } catch (e) { setApiError(e instanceof Error ? e.message : "Could not delete order."); } })(); }} className={deleteButtonClassName}>Delete</button></div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          {visible.length === 0 && <div className="flex flex-1 items-center justify-center px-4 py-14 text-center"><div><p className="m-0 text-[11px] font-medium text-[#897b6f]">{orders.length ? 'No matching orders' : 'No orders recorded'}</p><p className="mb-0 mt-1 text-[9px] text-[#a09387]">Create an order to track customers, items and totals.</p></div></div>}
          <div className="flex min-h-9 items-center justify-between border-t border-[#ebe2d7] px-2.5 text-[9px] text-[#817367] sm:px-3"><span>Showing {visible.length} of {orders.length} order entries</span><span>Order register</span></div>
        </div>
      </section>

      {isFormOpen && <TransactionDialog title={editing ? 'Update Order' : 'Create Order'} description="Enter the order details below." labelledBy="order-form-title" onClose={closeForm}>
        <form key={editing?.id ?? 'new-order'} onSubmit={saveOrder} className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={labelClassName}>Order Date<input required name="date" type="date" defaultValue={editing?.date ?? new Date().toISOString().slice(0,10)} className={`${fieldClassName} h-8 text-[10px]`} /></label>
            <label className={labelClassName}>Reference #<input name="reference" defaultValue={editing?.reference ?? ''} placeholder="Auto-generated" className={`${fieldClassName} h-8 text-[10px]`} /></label>
          </div>
          <label className={labelClassName}>Customer<input required name="customer" defaultValue={editing?.customer ?? ''} placeholder="Customer name" className={`${fieldClassName} h-8 text-[10px]`} /></label>
          <section className="rounded-md bg-[#f5eee5] p-2.5">
            <div className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_70px_110px_88px] sm:items-end">
              <label className={labelClassName}>Product<input value={item.product} onChange={(e) => setItem({ ...item, product: e.target.value })} placeholder="Select product" className={`${fieldClassName} h-8 text-[10px]`} /></label>
              <label className={labelClassName}>Qty<input value={item.quantity} onChange={(e) => setItem({ ...item, quantity: e.target.value })} type="number" min="1" className={`${fieldClassName} h-8 text-[10px]`} /></label>
              <label className={labelClassName}>Unit Price<input value={item.price} onChange={(e) => setItem({ ...item, price: e.target.value })} type="number" min="0" step="1" placeholder="Amount" className={`${fieldClassName} h-8 text-[10px]`} /></label>
              <button type="button" onClick={addItem} className="h-8 rounded-md bg-[#c5a98a] px-3 text-[10px] font-medium text-white">+ Add Item</button>
            </div>
            {items.length > 0 && <div className="mt-2 grid gap-1 rounded-md bg-white/60 p-2">{items.map((row,index) => <div key={`${row.product}-${index}`} className="grid grid-cols-[minmax(0,1fr)_45px_90px_20px] gap-2 border-b border-[#eee6dc] py-1 text-[9px] last:border-0"><span className="truncate">{row.product}</span><span>{row.quantity}</span><span>{formatTransactionMoney(row.quantity*row.price)}</span><button type="button" onClick={() => setItems((current) => current.filter((_,i)=>i!==index))} className="text-[#9b5549]">×</button></div>)}</div>}
          </section>
          <div className="grid gap-2 sm:grid-cols-2"><label className={labelClassName}>Status<select name="status" value={status} onChange={(e) => setStatus(e.target.value as Order['status'])} className={`${fieldClassName} h-8 text-[10px]`}><option>Pending</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select></label><label className={labelClassName}>Total<input readOnly value={formatTransactionMoney(total)} className={`${fieldClassName} h-8 bg-[#f8f3ec] text-[10px]`} /></label></div>
          <label className={labelClassName}>Notes<textarea name="notes" defaultValue={editing?.notes ?? ''} placeholder="Optional notes" className="min-h-14 rounded-md border border-[#e2d6c6] bg-white px-2.5 py-2 text-[10px] outline-none focus:border-[#805336]" /></label>
          <div className="flex justify-end gap-2"><button type="button" onClick={closeForm} className="h-8 rounded-md border border-[#e2d6c6] px-4 text-[10px] text-[#69594d]">Cancel</button><button type="submit" disabled={!items.length || busy} className="h-8 rounded-md bg-[#28180f] px-4 text-[10px] font-medium text-white disabled:opacity-50">{busy ? "Saving…" : editing ? 'Save Order' : 'Create Order'}</button></div>
        </form>
      </TransactionDialog>}
    </TransactionLayout>
  );
}
