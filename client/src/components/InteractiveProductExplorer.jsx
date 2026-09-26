import React, { useState } from 'react';
import { Activity, Shield, Sparkles, CheckCircle2, ChevronRight, Zap, Award, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const LAYERS = [
  {
    name: "Layer 1: Organic Bamboo Jacquard Fabric",
    desc: "Hypoallergenic, ultra-breathable, and anti-dust mite surface ensuring soft temperature regulation all night.",
    color: "from-emerald-400 to-teal-400"
  },
  {
    name: "Layer 2: Neodymium Bio-Magnets (3,500 - 4,000 Gauss)",
    desc: "Strategically aligned magnetic fields penetrate deep tissues, stimulating iron in hemoglobin to enhance blood circulation and oxygenation.",
    color: "from-cyan-400 to-blue-400",
    activeHighlight: true
  },
  {
    name: "Layer 3: Acupressure Therapeutic Foam",
    desc: "Targeted contouring relief across the cervical spine, lumbar region, and knee joints for restorative orthopedic sleep.",
    color: "from-indigo-400 to-purple-400"
  },
  {
    name: "Layer 4: Far-Infrared (FIR) Resonance Layer",
    desc: "Emits natural restorative far-infrared rays that soothe muscle stiffness, reduce lactic acid buildup, and lower stress.",
    color: "from-amber-400 to-orange-400"
  },
  {
    name: "Layer 5: Anti-Slip Breathable Bottom Base",
    desc: "Durable non-slip grip layer that anchors firmly to any single or double mattress.",
    color: "from-slate-400 to-slate-300"
  }
];

export default function InteractiveProductExplorer({ products = [] }) {
  const [activeLayer, setActiveLayer] = useState(1);
  const [activeProductIndex, setActiveProductIndex] = useState(0);

  const product = products[activeProductIndex] || {
    name: "Bio-Magnetic Healthcare Mattress Pad",
    tagline: "Natural Pain Relief, Improved Micro-Circulation & Deep Sleep Therapy",
    price: "₹7,499",
    features: ["Neodymium 4000 Gauss Magnets", "Orthopedic Memory Foam", "Acupressure Micro-Nodes", "100% Breathable Bamboo"],
    badge: "Flagship Product"
  };

  return (
    <section id="products" className="py-20 relative overflow-hidden bg-slate-950/60">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive Product Showcase
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Bio-Magnetic <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Health & Wellness System</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
            Engineered with therapeutic magnetic resonance to supercharge micro-circulation, melt chronic pain, and restore restful sleep naturally without pills.
          </p>

          {/* Product Switcher Pills */}
          <div className="flex flex-wrap justify-center gap-2.5 mt-8">
            {(products.length > 0 ? products : [product]).map((p, idx) => (
              <button
                key={idx}
                onClick={() => setActiveProductIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeProductIndex === idx
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                }`}
              >
                {p.name.split('(')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Interactive Showcase Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
          
          {/* Left: Interactive Multi-Layer Diagram */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Exploded Multi-Layer Technology</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                Click any layer to explore
              </span>
            </div>

            {/* Interactive Layer Slices */}
            <div className="space-y-3">
              {LAYERS.map((layer, index) => {
                const isSelected = activeLayer === index;
                return (
                  <div
                    key={index}
                    onClick={() => setActiveLayer(index)}
                    className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 border ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${layer.color} shadow-sm`}></div>
                        <h4 className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {layer.name}
                        </h4>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isSelected ? 'rotate-90 text-emerald-400' : ''}`} />
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-slate-700/60 text-xs text-slate-300 leading-relaxed animate-fade-in">
                        {layer.desc}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Micro Indicators */}
            <div className="grid grid-cols-3 gap-3 pt-3">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <div className="text-xs font-bold text-white">4,000 Gauss</div>
                <div className="text-[10px] text-slate-400">Therapeutic Power</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                <Shield className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-xs font-bold text-white">ISO & GMP</div>
                <div className="text-[10px] text-slate-400">Medical Standard</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                <Activity className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <div className="text-xs font-bold text-white">100% Safe</div>
                <div className="text-[10px] text-slate-400">Drug-Free Healing</div>
              </div>
            </div>
          </div>

          {/* Right: Product Highlights Card */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-800/80 to-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-700/70 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {product.badge || 'Certified Wellness'}
              </span>
              <div className="text-2xl font-black text-emerald-400">
                {product.price}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                {product.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {product.tagline}
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
              {(product.features || []).map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Direct Selling & Earning Synergy Banner */}
            <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                <Award className="w-4 h-4 text-emerald-400" />
                Distributor Benefits Included
              </div>
              <p className="text-[11px] text-emerald-300/80 leading-normal">
                Enrolling with this package unlocks Level 1 to Level 3 referral bonuses and 50 daily captcha tasks for additional income.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                to="/register"
                className="w-full text-center py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] transition-all"
              >
                Join Network & Order Package
              </Link>
              <Link
                to="/login"
                className="w-full text-center py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors"
              >
                Existing Member Login
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
