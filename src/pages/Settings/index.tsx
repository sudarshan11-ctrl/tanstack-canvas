import { useState } from "react";
import { Scale, Palette, Target } from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import WeightManager from "./WeightManager";
import AppearanceSettings from "./AppearanceSettings";

type SettingsTab = "weights" | "appearance" | "targets";

const TABS: { id: SettingsTab; label: string; icon: typeof Scale }[] = [
  { id: "weights", label: "Performance Index Weights", icon: Scale },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "targets", label: "RRR Targets", icon: Target },
];

function RrrTargets() {
  const targets = [
    {
      role: "Practice Head",
      target: 85,
      description: "Minimum PI to be considered on-track",
    },
    { role: "Partner", target: 80, description: "Mid-career performance standard" },
    {
      role: "Associate",
      target: 75,
      description: "Entry-level on-track threshold",
    },
  ];

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <div className="text-[17px] font-semibold" style={{ color: "var(--text-1)" }}>
          Required Run Rate targets
        </div>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>
          Per-role Performance Index targets used to calculate RRR and MatchCentre
          strap values. Shown as "Target 80 for Partners" on the strap.
        </p>
      </div>
      <div className="space-y-2">
        {targets.map((t) => (
          <div
            key={t.role}
            className="flex items-center gap-4 rounded-lg border p-4"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--line)",
            }}
          >
            <div className="flex-1">
              <div className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>
                {t.role}
              </div>
              <div className="text-[12px]" style={{ color: "var(--text-2)" }}>
                {t.description}
              </div>
            </div>
            <div
              className="tabular font-mono text-[24px] font-bold"
              style={{ color: "var(--lks-accent)" }}
            >
              {t.target}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px]" style={{ color: "var(--text-2)" }}>
        Editing targets is coming in a future release. Contact a system administrator to
        adjust these values.
      </p>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<SettingsTab>("weights");

  return (
    <PageWrapper>
      <div className="mx-auto w-full max-w-7xl">
        {/* Page title */}
        <div
          className="font-display mb-6 text-[28px] leading-tight"
          style={{ color: "var(--text-1)" }}
        >
          Settings
        </div>

        {/* Tab bar */}
        <div
          className="mb-6 flex gap-0 border-b"
          style={{ borderColor: "var(--line)" }}
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-medium transition-colors"
                style={{
                  borderColor: active ? "var(--lks-accent)" : "transparent",
                  color: active ? "var(--lks-accent)" : "var(--text-2)",
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === "weights" && <WeightManager />}
        {tab === "appearance" && <AppearanceSettings />}
        {tab === "targets" && <RrrTargets />}
      </div>
    </PageWrapper>
  );
}
