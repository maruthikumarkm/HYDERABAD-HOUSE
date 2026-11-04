import React from 'react';
import { Flame, ShieldCheck, Clock, MapPin, Phone, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-charcoal-950 text-cream-200 pt-16 pb-12 border-t-4 border-gold-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-charcoal-800">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-maroon-800 flex items-center justify-center border border-gold-400">
                <Flame className="w-6 h-6 text-gold-400" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-white tracking-wider">HYDERABAD HOUSE</h3>
                <p className="text-[10px] uppercase tracking-widest text-gold-400">Heritage Biryani Since 1975</p>
              </div>
            </div>
            <p className="text-xs text-cream-400 leading-relaxed">
              Legendary Hyderabadi Dum Pukht cuisine. Slow-cooked in sealed handis over charcoal embers with pure saffron, aged basmati and royal spices.
            </p>
            <div className="flex items-center space-x-2 text-xs text-gold-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Halal & FSSAI Certified</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif font-semibold text-sm uppercase tracking-wider text-gold-400">Direct Ordering</h4>
            <ul className="space-y-2 text-xs text-cream-300">
              <li><Link to="/#menu" className="hover:text-gold-300 transition-colors">Royal Biryanis & Combos</Link></li>
              <li><Link to="/outlets" className="hover:text-gold-300 transition-colors">14 Outlets & 3 Cloud Kitchens</Link></li>
              <li><Link to="/party-orders" className="hover:text-gold-300 transition-colors">Party & Corporate Catering</Link></li>
              <li><Link to="/track" className="hover:text-gold-300 transition-colors">Live Kitchen Tracking</Link></li>
              <li><Link to="/login" className="hover:text-gold-300 transition-colors">Employee & Staff Portal</Link></li>
            </ul>
          </div>

          {/* Prominent Outlets */}
          <div className="space-y-3">
            <h4 className="font-serif font-semibold text-sm uppercase tracking-wider text-gold-400">Key Outlets in Hyderabad</h4>
            <ul className="space-y-2 text-xs text-cream-300">
              <li className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-gold-500 mt-0.5 flex-shrink-0" />
                <span>Kondapur • Hitec City Road</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-gold-500 mt-0.5 flex-shrink-0" />
                <span>Gachibowli Cloud Kitchen • DLF Lane</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-gold-500 mt-0.5 flex-shrink-0" />
                <span>Banjara Hills Road No 12</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-gold-500 mt-0.5 flex-shrink-0" />
                <span>Kukatpally KPHB Colony</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-gold-500 mt-0.5 flex-shrink-0" />
                <span>Charminar Heritage Old City</span>
              </li>
            </ul>
          </div>

          {/* Hours & Contact */}
          <div className="space-y-3">
            <h4 className="font-serif font-semibold text-sm uppercase tracking-wider text-gold-400">Kitchen Timings</h4>
            <div className="space-y-2 text-xs text-cream-300">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gold-500 flex-shrink-0" />
                <span>All 7 Days: 11:30 AM – 11:30 PM</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gold-500 flex-shrink-0" />
                <span>Hotline: +91 40 2345 0001</span>
              </div>
              <div className="pt-2 text-[11px] text-cream-400">
                GST Included (5%). Prices transparent on direct platform with no 3rd-party delivery inflation.
              </div>
            </div>
          </div>
        </div>

        {/* DPDP Act 2023 Compliance & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-cream-400 space-y-4 md:space-y-0">
          <div>
            © {new Date().getFullYear()} HYDERABAD HOUSE (India) Pvt. Ltd. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 text-[11px]">
            <span>DPDP Act 2023 Compliant</span>
            <span className="hover:underline cursor-pointer">Privacy Notice</span>
            <span className="hover:underline cursor-pointer">Terms of Service</span>
            <span className="hover:underline cursor-pointer">Food Safety Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
