
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
    desc: "Soft, breathable fabric designed for comfortable temperature regulation during sleep.",
    color: "from-emerald-400 to-teal-400",
    glow: "hover:border-emerald-400/60",
    active:
      "border-emerald-400/70 from-emerald-500/20 to-teal-500/10",
  },
  {
    name: "Layer 2: Neodymium Bio-Magnets (3,500 - 4,000 Gauss)",
    desc: "A magnetic layer featuring aligned neodymium magnets. Claims about improved circulation or other medical benefits require reliable clinical evidence.",
    color: "from-cyan-400 to-blue-500",
    glow: "hover:border-cyan-400/60",
    active:
      "border-cyan-400/70 from-cyan-500/20 to-blue-500/10",
  },
  {
    name: "Layer 3: Acupressure Therapeutic Foam",
    desc: "Contoured foam with textured nodes, designed to provide a distinctive feel and support a comfortable resting surface.",
    color: "from-indigo-400 to-purple-500",
    glow: "hover:border-purple-400/60",
    active:
      "border-purple-400/70 from-indigo-500/20 to-purple-500/10",
  },
  {
    name: "Layer 4: Far-Infrared (FIR) Resonance Layer",
    desc: "A far-infrared layer included in the product design. Specific claims about pain relief or other health effects should be clinically substantiated.",
    color: "from-amber-400 to-orange-500",
    glow: "hover:border-orange-400/60",
    active:
      "border-orange-400/70 from-amber-500/20 to-orange-500/10",
  },
  {
    name: "Layer 5: Anti-Slip Breathable Bottom Base",
    desc: "A durable, breathable base designed to help keep the pad securely positioned on a mattress.",
    color: "from-pink-400 to-rose-500",
    glow: "hover:border-pink-400/60",
    active:
      "border-pink-400/70 from-pink-500/20 to-rose-500/10",
  },
];

const DEFAULT_PRODUCT = {
  name: "Bio-Magnetic Healthcare Mattress Pad",
  tagline:
    "Comfort-focused design for your sleep and wellness routine",
  price: "₹7,499",
  features: [
    "Neodymium 4000 Gauss Magnets",
    "Orthopedic Memory Foam",
    "Acupressure Micro-Nodes",
    "Breathable Bamboo Fabric",
  ],
  badge: "Flagship Product",
};

export default function InteractiveProductExplorer({
  products = [],
}) {
  const [activeLayer, setActiveLayer] = useState(1);
  const [activeProductIndex, setActiveProductIndex] =
    useState(0);

  const product =
    products[activeProductIndex] || DEFAULT_PRODUCT;

  const displayedProducts =
    products.length > 0 ? products : [DEFAULT_PRODUCT];

  return (
    <section
      id="products"
      className="relative isolate overflow-hidden bg-slate-950 py-20 text-white"
    >
      {/* Animated rainbow background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="rainbow-orb absolute left-[-10%] top-[10%] h-72 w-72 rounded-full bg-red-500/20 blur-[110px]" />
        <div className="rainbow-orb rainbow-delay-1 absolute right-[-8%] top-[25%] h-80 w-80 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="rainbow-orb rainbow-delay-2 absolute bottom-[-10%] left-[35%] h-80 w-80 rounded-full bg-purple-500/20 blur-[120px]" />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.10),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="rainbow-border mb-5 inline-flex rounded-full p-[1px]">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-100">
              <Sparkles className="rainbow-icon h-4 w-4" />
              Interactive Product Showcase
            </div>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Bio-Magnetic{" "}
            <span className="rainbow-text">
              Health & Wellness System
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Explore the product layers, materials, and features
            through an interactive multicolor showcase.
          </p>

          {/* Product Switcher */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {displayedProducts.map((p, idx) => (
              <button
                key={p.id || p._id || `${p.name}-${idx}`}
                type="button"
                onClick={() => setActiveProductIndex(idx)}
                aria-pressed={activeProductIndex === idx}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-300 sm:text-sm ${
                  activeProductIndex === idx
                    ? "rainbow-button scale-[1.03] text-white shadow-lg shadow-purple-500/20"
                    : "border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-purple-400/60 hover:bg-slate-800"
                }`}
              >
                {(p.name || "Product").split("(")[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Main Showcase */}
        <div className="rainbow-card rounded-3xl p-[1px]">
          <div className="grid grid-cols-1 items-center gap-8 rounded-[23px] bg-slate-950/95 p-5 backdrop-blur-xl sm:p-8 lg:grid-cols-12 lg:p-10">
            {/* Left: Interactive Layers */}
            <div className="space-y-5 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <Layers className="h-5 w-5 text-cyan-400" />
                  <span>Exploded Multi-Layer Technology</span>
                </div>

                <span className="rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-1.5 text-[11px] font-semibold text-purple-200">
                  Click any layer to explore
                </span>
              </div>

              <div className="space-y-3">
                {LAYERS.map((layer, index) => {
                  const isSelected = activeLayer === index;

                  return (
                    <button
                      key={layer.name}
                      type="button"
                      onClick={() => setActiveLayer(index)}
                      aria-expanded={isSelected}
                      className={`group w-full rounded-2xl border bg-gradient-to-r p-4 text-left transition-all duration-300 ${
                        isSelected
                          ? `scale-[1.01] ${layer.active} shadow-lg shadow-purple-500/10`
                          : `border-slate-800/90 from-slate-900/90 to-slate-950 hover:-translate-y-0.5 ${layer.glow}`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`h-3.5 w-3.5 shrink-0 rounded-full bg-gradient-to-r ${layer.color} shadow-lg`}
                          />

                          <span
                            className={`text-left text-xs font-bold leading-5 sm:text-sm ${
                              isSelected
                                ? "text-white"
                                : "text-slate-300 group-hover:text-white"
                            }`}
                          >
                            {layer.name}
                          </span>
                        </div>

                        <ChevronRight
                          className={`h-5 w-5 shrink-0 transition-all duration-300 ${
                            isSelected
                              ? "rotate-90 text-cyan-300"
                              : "text-slate-500 group-hover:text-purple-300"
                          }`}
                        />
                      </div>

                      {isSelected && (
                        <div className="mt-4 border-t border-white/10 pt-3 text-xs leading-6 text-slate-300 sm:text-sm">
                          {layer.desc}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feature Indicators */}
              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-4 text-center transition hover:border-cyan-400/50">
                  <Zap className="mx-auto mb-2 h-5 w-5 text-cyan-300" />
                  <div className="text-sm font-bold text-white">
                    4,000 Gauss
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    Magnetic Specification
                  </div>
                </div>

                <div className="rounded-xl border border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-4 text-center transition hover:border-purple-400/50">
                  <Shield className="mx-auto mb-2 h-5 w-5 text-purple-300" />
                  <div className="text-sm font-bold text-white">
                    ISO & GMP
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    Verify Applicable Certifications
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 text-center transition hover:border-emerald-400/50">
                  <Activity className="mx-auto mb-2 h-5 w-5 text-emerald-300" />
                  <div className="text-sm font-bold text-white">
                    Drug-Free Design
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    Product Feature
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Product Details */}
            <div className="rainbow-card rounded-2xl p-[1px] lg:col-span-5">
              <div className="space-y-6 rounded-[15px] bg-gradient-to-b from-slate-900 to-slate-950 p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-200">
                    {product.badge || "Featured Product"}
                  </span>

                  <div className="rainbow-text text-2xl font-black">
                    {product.price}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold leading-snug text-white sm:text-2xl">
                    {product.name}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {product.tagline}
                  </p>
                </div>

                {/* Product Features */}
                <div className="space-y-3 border-t border-slate-800 pt-5">
                  {(product.features || []).map((feat, i) => (
                    <div
                      key={`${feat}-${i}`}
                      className="flex items-start gap-3 text-sm text-slate-200"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Distributor Information */}
                <div className="rounded-xl border border-purple-400/30 bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-cyan-500/10 p-4">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Award className="h-5 w-5 text-amber-300" />
                    Distributor Benefits
                  </div>

                  <p className="mt-2 text-xs leading-6 text-slate-300">
                    Review the applicable referral program rules,
                    account eligibility, and task availability
                    before activation. Earnings are subject to
                    the published program terms.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-1">
                  <Link
                    to="/activate-account"
                    className="rainbow-button inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/20 sm:text-sm"
                  >
                    <UserCheck className="h-4 w-4" />
                    Activate Existing Account
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-center text-xs font-semibold text-slate-300 transition-all hover:border-cyan-400/50 hover:bg-slate-800 hover:text-white sm:text-sm"
                  >
                    Existing Member Login
                  </Link>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-[11px] leading-5 text-slate-400">
                  New member registration is available only
                  inside the authenticated member dashboard.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
