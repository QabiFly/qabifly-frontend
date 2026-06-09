import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatRupee(amount: string | number): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "₹0";
  return "₹" + n.toLocaleString("en-IN");
}

export function timeAgo(dateStr: string): string {
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (diff < 60)    return "Abhi";
  if (diff < 3600)  return `${Math.floor(diff / 60)} min pehle`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ghante pehle`;
  return `${Math.floor(diff / 86400)} din pehle`;
}

export function getInitial(name?: string | null): string {
  return (name || "U")[0].toUpperCase();
}

export function extractData(res: any, fallback: any = null) {
  return res?.data?.data?.results
    ?? res?.data?.data
    ?? res?.data?.results
    ?? fallback;
}