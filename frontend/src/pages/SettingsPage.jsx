import React, { useEffect, useState } from "react";
import { FiDownload, FiMoon, FiMonitor, FiSmartphone, FiSun, FiZap } from "react-icons/fi";
import AppShell from "../components/layout/AppShell.jsx";
import Header from "../components/layout/Header.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { usePWAInstall } from "../hooks/usePWAInstall.js";

const themeOptions = [
  { id: "light", label: "Light", icon: FiSun },
  { id: "dark", label: "Dark", icon: FiMoon },
  { id: "system", label: "System", icon: FiMonitor },
  { id: "amoled", label: "AMOLED", icon: FiSmartphone },
];

const accentOptions = ["#e5b85c", "#e0b34f", "#c9942b", "#f0c96a"];

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { canInstall, install } = usePWAInstall();
  const [accent, setAccent] = useState(localStorage.getItem("tasknote-accent") || "#e5b85c");

  useEffect(() => {
    localStorage.setItem("tasknote-accent", accent);
    document.documentElement.style.setProperty("--primary", accent);
    document.documentElement.style.setProperty("--accent", accent);
  }, [accent]);

  return (
    <AppShell>
      {({ openMenu }) => (
        <>
          <Header
            title="Settings"
            subtitle="Shape TaskNote into a workspace that feels calm, fast, and yours."
            onMenu={openMenu}
          />

          <div className="mx-auto grid max-w-5xl gap-5">
            <section className="rounded-3xl border border-[#242424] bg-[#121212] p-5 shadow-2xl shadow-black/20">
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e5b85c]">Appearance</p>
                <h2 className="mt-1 text-2xl font-black text-[#f5f5f5]">Premium dark workspace</h2>
                <p className="mt-1 text-sm text-[#a3a3a3]">
                  Theme changes apply instantly and are saved on this device.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const active = theme === option.id;
                  return (
                    <button
                      key={option.id}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-[#e5b85c] bg-[#e5b85c] text-[#171107]"
                          : "border-[#242424] bg-[#0b0b0b] text-[#a3a3a3] hover:border-[#e5b85c]/50 hover:text-[#f5f5f5]"
                      }`}
                      type="button"
                      onClick={() => setTheme(option.id)}
                    >
                      <Icon className="mb-3 text-xl" />
                      <span className="font-black">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-[#242424] bg-[#121212] p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e5b85c]">Accent</p>
                <h2 className="mt-1 text-xl font-black text-[#f5f5f5]">Warm gold system</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {accentOptions.map((color) => (
                    <button
                      key={color}
                      className={`h-11 w-11 rounded-2xl border-2 transition ${accent === color ? "border-white" : "border-[#242424]"}`}
                      style={{ backgroundColor: color }}
                      type="button"
                      onClick={() => setAccent(color)}
                      aria-label={`Use accent ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[#242424] bg-[#121212] p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e5b85c]">PWA</p>
                <h2 className="mt-1 text-xl font-black text-[#f5f5f5]">Install TaskNote</h2>
                <p className="mt-2 text-sm text-[#a3a3a3]">
                  Use the app in standalone mode with offline shell support after your first visit.
                </p>
                {canInstall && (
                  <button
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#e5b85c] px-4 py-3 font-black text-[#171107] transition hover:bg-[#f0c96a]"
                    type="button"
                    onClick={install}
                  >
                    <FiDownload />
                    Install app
                  </button>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-[#242424] bg-[#121212] p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e5b85c]">Shortcuts</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["Ctrl / Cmd + K", "Open command palette"],
                  ["Ctrl / Cmd + N", "Open Quick Add"],
                  ["Esc", "Close dialogs"],
                ].map(([keys, label]) => (
                  <div key={keys} className="rounded-2xl border border-[#242424] bg-[#0b0b0b] p-4">
                    <kbd className="text-sm font-black text-[#f5f5f5]">{keys}</kbd>
                    <p className="mt-2 text-sm text-[#a3a3a3]">{label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-[#242424] bg-[#121212] p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e5b85c] text-[#171107]">
                  <FiZap />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#f5f5f5]">About TaskNote</h2>
                  <p className="mt-1 text-sm leading-6 text-[#a3a3a3]">
                    TaskNote is a personal productivity workspace for notes, tasks, planning, focus, habits, and analytics.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
};

export default SettingsPage;
