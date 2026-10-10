import React, { useState } from "react";
import {
  Activity,
  Shield,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Zap,
  Award,
  Layers,
  UserCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

const LAYERS = [
  {
    name: "Layer 1: Organic Bamboo Jacquard Fabric",
    desc: "Hypoallergenic, ultra-breathable, and anti-dust mite surface ensuring soft temperature regulation all night.",
    color: "from-emerald-400 to-teal-400",
  },
  {
    name: "Layer 2: Neodymium Bio-Magnets (3,500 - 4,000 Gauss)",
    desc: "Strategically aligned magnetic fields penetrate deep tissues, stimulating iron in hemoglobin to enhance blood circulation and oxygenation.",
    color: "from-cyan-400 to-blue-400",
    activeHighlight: true,
  },
  {
    name: "Layer 3: Acupressure Therapeutic Foam",
    desc: "Targeted contouring relief across the cervical spine, lumbar region, and knee joints for restorative orthopedic sleep.",
    color: "from-indigo-400 to-purple-400",
  },
  {
    name: "Layer 4: Far-Infrared (FIR) Resonance Layer",
    desc: "Emits natural restorative far-infrared rays that soothe muscle stiffness, reduce lactic acid buildup, and lower stress.",
    color: "from-amber-400 to-orange-400",
  },
  {
    name: "Layer 5: Anti-Slip Breathable Bottom Base",
    desc: "Durable non-slip grip layer that anchors firmly to any single or double mattress.",
    color: "from-slate-400 to-slate-300",
  },
];

export default function InteractiveProductExplorer({
  products = [],
}) {
  const [activeLayer, setActiveLayer] = useState(1);
  const [activeProductIndex, setActiveProductIndex] =
    useState(0);

  const product = products[activeProductIndex] || {
    name: "Bio-Magnetic Healthcare Mattress Pad",
    tagline:
      "Natural Pain Relief, Improved Micro-Circulation & Deep Sleep Therapy",
    price: "₹7,499",
    features: [
      "Neodymium 4000 Gauss Magnets",
      "Orthopedic Memory Foam",
      "Acupressure Micro-Nodes",
      "100% Breathable Bamboo",
    ],
    badge: "Flagship Product",
  };

  return (
    <section
      id="products"
      className="relative overflow-hidden bg-slate-950/60 py-20"
    >
      {/* Background radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8">

        {/* Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            Interactive Product Showcase
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Bio-Magnetic{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Health & Wellness System
            </span>
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
            Engineered with therapeutic magnetic resonance to
            supercharge micro-circulation, melt chronic pain,
            and restore restful sleep naturally without pills.
          </p>

          {/* Product Switcher Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">

            {(products.length > 0
              ? products
              : [product]
            ).map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  setActiveProductIndex(idx)
                }
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeProductIndex === idx
                    ? "scale-105 bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80"
                }`}
              >
                {p.name
                  .split("(")[0]
                  .trim()}
              </button>
            ))}

          </div>
        </div>

        {/* 3D Interactive Showcase Card */}
        <div className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-10 lg:grid-cols-12">

          {/* Left: Interactive Multi-Layer Diagram */}
          <div className="space-y-4 lg:col-span-7">

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">

              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">

                <Layers className="h-4 w-4 text-emerald-400" />

                <span>
                  Exploded Multi-Layer Technology
                </span>

              </div>

              <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                Click any layer to explore
              </span>

            </div>

            {/* Interactive Layer Slices */}
            <div className="space-y-3">

              {LAYERS.map(
                (layer, index) => {
                  const isSelected =
                    activeLayer === index;

                  return (
                    <div
                      key={index}
                      onClick={() =>
                        setActiveLayer(index)
                      }
                      className={`cursor-pointer rounded-2xl border p-4 transition-all duration-300 ${
                        isSelected
                          ? "scale-[1.02] border-emerald-500 bg-slate-800/90 shadow-lg shadow-emerald-500/10"
                          : "border-slate-800/80 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/50"
                      }`}
                    >

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-3">

                          <div
                            className={`h-3 w-3 rounded-full bg-gradient-to-r ${layer.color} shadow-sm`}
                          />

                          <h4
                            className={`text-xs font-bold sm:text-sm ${
                              isSelected
                                ? "text-white"
                                : "text-slate-300"
                            }`}
                          >
                            {layer.name}
                          </h4>

                        </div>

                        <ChevronRight
                          className={`h-4 w-4 text-slate-500 transition-transform ${
                            isSelected
                              ? "rotate-90 text-emerald-400"
                              : ""
                          }`}
                        />

                      </div>

                      {isSelected && (
                        <div className="mt-3 border-t border-slate-700/60 pt-3 text-xs leading-relaxed text-slate-300">
                          {layer.desc}
                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>

            {/* Micro Indicators */}
            <div className="grid grid-cols-3 gap-3 pt-3">

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">

                <Zap className="mx-auto mb-1 h-4 w-4 text-amber-400" />

                <div className="text-xs font-bold text-white">
                  4,000 Gauss
                </div>

                <div className="text-[10px] text-slate-400">
                  Therapeutic Power
                </div>

              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">

                <Shield className="mx-auto mb-1 h-4 w-4 text-emerald-400" />

                <div className="text-xs font-bold text-white">
                  ISO & GMP
                </div>

                <div className="text-[10px] text-slate-400">
                  Medical Standard
                </div>

              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">

                <Activity className="mx-auto mb-1 h-4 w-4 text-cyan-400" />

                <div className="text-xs font-bold text-white">
                  100% Safe
                </div>

                <div className="text-[10px] text-slate-400">
                  Drug-Free Healing
                </div>

              </div>

            </div>
          </div>

          {/* Right: Product Highlights Card */}
          <div className="space-y-6 rounded-2xl border border-slate-700/70 bg-gradient-to-b from-slate-800/80 to-slate-950 p-6 shadow-xl sm:p-8 lg:col-span-5">

            <div className="flex items-center justify-between">

              <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-300">
                {product.badge ||
                  "Certified Wellness"}
              </span>

              <div className="text-2xl font-black text-emerald-400">
                {product.price}
              </div>

            </div>

            <div>

              <h3 className="text-xl font-bold text-white">
                {product.name}
              </h3>

              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {product.tagline}
              </p>

            </div>

            {/* Feature Checklist */}
            <div className="space-y-2.5 border-t border-slate-800 pt-2 text-xs">

              {(product.features || []).map(
                (feat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 text-slate-200"
                  >

                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />

                    <span>
                      {feat}
                    </span>

                  </div>
                )
              )}

            </div>

            {/* Direct Selling & Earning Synergy Banner */}
            <div className="space-y-1 rounded-xl border border-emerald-500/30 bg-emerald-950/60 p-3.5 text-xs text-emerald-200">

              <div className="flex items-center gap-1.5 font-bold text-emerald-300">

                <Award className="h-4 w-4 text-emerald-400" />

                Distributor Benefits Included

              </div>

              <p className="text-[11px] leading-normal text-emerald-300/80">
                Enrolling with this package unlocks Level 1
                to Level 3 referral bonuses and 50 daily
                captcha tasks for additional income.
              </p>

            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">

              {/* Public registration is disabled.
                  New members are created by authenticated
                  members from their dashboard. */}

              <Link
                to="/activate-account"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] hover:shadow-emerald-500/40"
              >
                <UserCheck className="h-4 w-4" />
                Activate Existing Account
              </Link>

              <Link
                to="/login"
                className="w-full rounded-xl bg-slate-800/80 px-4 py-2.5 text-center text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                Existing Member Login
              </Link>

            </div>

            <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-3.5 py-3 text-[11px] leading-5 text-slate-400">
              New member registration is available only
              inside the authenticated member dashboard.
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}