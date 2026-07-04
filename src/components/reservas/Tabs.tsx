import React from "react";

export interface TabItem {
  key: string;
  label: string;
  badge?: number | string;
  /** "alert" renders the badge as an attention-grabbing amber pulse instead of a neutral count. */
  badgeVariant?: "default" | "alert";
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange }) => {
  return (
    <div className="flex items-center gap-4 border-b border-zinc-200 overflow-x-auto">
      {tabs.map(t => (
        <button
          key={t.key}
          type="button"
          disabled={t.disabled}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            active === t.key
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {t.label}
          {t.badge !== undefined && (
            t.badgeVariant === "alert" ? (
              <span className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.25 rounded-full text-[9px] bg-amber-100 text-amber-800 border border-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {t.badge}
              </span>
            ) : (
              <span className={`ml-1.5 px-1.5 py-0.25 rounded-full text-[9px] ${active === t.key ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-600"}`}>
                {t.badge}
              </span>
            )
          )}
        </button>
      ))}
    </div>
  );
};
