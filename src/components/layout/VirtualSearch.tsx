"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export function VirtualSearch() {
  const router = useRouter();
  const [open,  setOpen]  = useState(false);
  const [input, setInput] = useState("");

  const go = () => {
    if (!input.trim()) return;
    const vn = input.trim().replace(/^@/, "");
    router.push(`/u/@${vn}`);
    setOpen(false);
    setInput("");
  };

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 bg-purple-50 text-purple-600 text-xs font-bold px-3 py-1.5 rounded-full border border-purple-100">
      <Search size={12} />
      @Virtual
    </button>
  );

  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-sm">@</span>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="ROI00786"
          className="w-32 bg-white border border-purple-200 rounded-xl pl-7 pr-2 py-1.5 text-xs font-mono outline-none focus:border-purple-500"
        />
      </div>
      <button onClick={go}
        className="w-7 h-7 grad rounded-full flex items-center justify-center shadow-sm">
        <Search size={12} className="text-white" />
      </button>
      <button onClick={() => { setOpen(false); setInput(""); }}
        className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
        <X size={12} className="text-gray-500" />
      </button>
    </div>
  );
}
