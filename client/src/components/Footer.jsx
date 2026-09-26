import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, MapPin, Phone, Mail, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function Footer() {
  const { cmsContent } = useAuth();

  const address = cmsContent?.officeAddress || "Ganga Shopping Mall, 2nd Floor, Main Agra Road, Dausa, Rajasthan 303303";
  const phone = cmsContent?.supportPhone || "+91 98765 43210";
  const email = cmsContent?.supportEmail || "contact@samarthindia.com";

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-400 p-[2px]">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                SAMARTH <span className="text-emerald-400">INDIA</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Leading the revolution in Bio-Magnetic restorative healthcare and empowering digital community members across India through transparent referral rewards.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Tax Compliant (5% TDS Section 194H)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-2">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-emerald-400 transition-colors">Home Page</Link></li>
              <li><a href="#products" className="hover:text-emerald-400 transition-colors">Bio-Magnetic Products</a></li>
              <li><a href="#working-process" className="hover:text-emerald-400 transition-colors">Working Process</a></li>
              <li><a href="#about" className="hover:text-emerald-400 transition-colors">About Samarth India</a></li>
              <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Distributor Login</Link></li>
              <li><Link to="/register" className="hover:text-emerald-400 transition-colors">Register with Sponsor ID</Link></li>
            </ul>
          </div>

          {/* Member & Earning Desk */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-teal-500 pl-2">
              Member Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/dashboard/captcha" className="hover:text-teal-400 transition-colors">Daily Captcha Workstation</Link></li>
              <li><Link to="/dashboard/tree" className="hover:text-teal-400 transition-colors">Genealogy Network Tree</Link></li>
              <li><Link to="/dashboard/wallet" className="hover:text-teal-400 transition-colors">Wallet & TDS Payouts</Link></li>
              <li><Link to="/dashboard/profile" className="hover:text-teal-400 transition-colors">PAN & Bank KYC Verification</Link></li>
              <li><Link to="/admin" className="text-amber-400 hover:text-amber-300 font-medium">Administrator Access</Link></li>
            </ul>
          </div>

          {/* Corporate Office */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-amber-500 pl-2">
              Head Office
            </h4>
            <div className="flex items-start gap-2.5 text-xs">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{address}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{phone}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{email}</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Samarth India. All Rights Reserved. Managed via React MERN CMS.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Direct Selling Rules 2021 Compliant</span>
            <span>•</span>
            <span>Sec. 194H TDS Registered</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
