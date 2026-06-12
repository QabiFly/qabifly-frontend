"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { orderApi } from "@/lib/api";
import { TopNav } from "@/components/layout/navbar";
import { ArrowLeft, Package, CheckCircle } from "lucide-react";
import { formatRupee } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = ["PENDING","CONFIRMED","READY","OUT_FOR_DELIVERY","DELIVERED"];

const STATUS_COLOR: Record<string, string> = {
  PENDING:          "#F59E0B",
  CONFIRMED:        "#4B7BF5",
  READY:            "#8B5CF6",
  OUT_FOR_DELIVERY: "#F97316",
  DELIVERED:        "#059669",
  CANCELLED:        "#EF4444",
};

export default function OrderDetailPage() {
  const { orderNumber } = useParams();
  const router          = useRouter();
  const [order,   setOrder]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (!orderNumber || fetched.current) return;
    fetched.current = true;
    orderApi.detail(orderNumber as string)
      .then((r) => setOrder(r.data.data))
      .catch(() => toast.error("Order not found"))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {[1,2,3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Package size={48} className="text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500">Order not found</p>
        <button onClick={() => router.back()}
          className="text-purple-600 font-bold text-sm mt-2">
          ← Wapas
        </button>
      </div>
    </div>
  );

  const currentStep = STEPS.indexOf(order.status);

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <TopNav />
      <div className="max-w-md mx-auto px-4 pt-4">

        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-400 text-sm mb-4 hover:text-gray-600">
          <ArrowLeft size={14} /> Back
        </button>

        {/* Header */}
        <div className="grad rounded-3xl p-5 mb-4 text-white shadow-xl shadow-purple-300/30">
          <p className="text-white/70 text-xs font-medium">Order Number</p>
          <h1 className="font-extrabold text-2xl font-mono mt-1">
            #{order.order_number}
          </h1>
          <p className="text-white/70 text-sm mt-1">{order.shop_name}</p>
          <div className="flex items-center justify-between mt-3">
            <span
              className="text-xs font-extrabold px-3 py-1 rounded-full bg-white/20"
            >
              {order.status.replace(/_/g, " ")}
            </span>
            <span className="font-extrabold text-xl">
              {formatRupee(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Status Tracker */}
        {order.status !== "CANCELLED" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h3 className="font-bold text-sm text-gray-900 mb-4">Order Track</h3>
            <div className="space-y-3">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    i <= currentStep ? "grad" : "bg-gray-100"
                  }`}>
                    {i <= currentStep
                      ? <CheckCircle size={14} className="text-white" />
                      : <span className="text-gray-400 text-xs font-bold">{i+1}</span>
                    }
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${
                      i <= currentStep ? "text-gray-900" : "text-gray-400"
                    }`}>
                      {step.replace(/_/g, " ")}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`absolute ml-3 mt-7 w-0.5 h-3 ${
                      i < currentStep ? "bg-purple-400" : "bg-gray-200"
                    }`} style={{ position:"relative", left: "-120px", marginTop:"4px" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {order.status === "CANCELLED" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-center">
            <p className="text-red-600 font-bold text-lg">❌ Order Cancelled!</p>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
          <h3 className="font-bold text-sm text-gray-900 mb-3">Items</h3>
          {(order.items || []).map((item: any, i: number) => (
            <div key={i} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-semibold text-sm text-gray-900">{item.product_name}</p>
                <p className="text-xs text-gray-400">x{item.quantity}</p>
              </div>
              <p className="font-bold text-sm text-purple-600">
                {formatRupee(item.line_total)}
              </p>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          {[
            { l: "Subtotal",    v: formatRupee(order.subtotal || "0") },
            { l: "Delivery",    v: formatRupee(order.delivery_charge || "0") },
            { l: "Payment",     v: order.payment_method },
            { l: "Address",     v: order.delivery_address },
          ].map((r) => (
            <div key={r.l} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-gray-400 text-sm">{r.l}</span>
              <span className="font-semibold text-sm text-gray-900 text-right max-w-[55%] leading-snug">
                {r.v}
              </span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-1">
            <span className="font-extrabold text-gray-900">Total</span>
            <span className="font-extrabold text-purple-600 text-lg">
              {formatRupee(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Cancel */}
        {["PENDING","CONFIRMED"].includes(order.status) && (
          <button
            onClick={async () => {
              if (!confirm("Order cancel karein?")) return;
              try {
                await orderApi.cancel(order.order_number, "Customer request");
                toast.success("Order cancelled");
                router.push("/orders");
              } catch {
                toast.error("Cancellation Failed!");
              }
            }}
            className="w-full py-3 bg-red-50 border border-red-200 text-red-500 font-bold rounded-xl text-sm"
          >
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
}
