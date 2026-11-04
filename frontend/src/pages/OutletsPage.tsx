import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock, Navigation, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { Outlet } from '../types';
import { useCart } from '../context/CartContext';
import api from '../services/api';

export const OutletsPage: React.FC = () => {
  const { selectedOutlet, setSelectedOutlet } = useCart();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'DINE_IN_TAKEAWAY' | 'CLOUD_KITCHEN'>('ALL');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get('/outlets')
      .then((res) => setOutlets(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = outlets.filter((o) => {
    if (filterType === 'ALL') return true;
    return o.type === filterType;
  });

  const handleSelectAndOrder = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    navigate('/#menu');
  };

  return (
    <div className="min-h-screen py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs uppercase font-bold text-gold-700 tracking-widest bg-gold-50 px-3 py-1 rounded-full border border-gold-200">
          Hyderabad City Network
        </span>
        <h1 className="font-serif font-black text-3xl sm:text-4xl text-maroon-950">
          Our Outlets & Cloud Kitchens
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-600">
          14 Landmark Restaurants and 3 High-Capacity Cloud Kitchens delivering authentic Nizami dum food across the twin cities.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center space-x-2">
        {[
          { id: 'ALL', label: 'All 17 Locations' },
          { id: 'DINE_IN_TAKEAWAY', label: 'Dine-in & Takeaway (14)' },
          { id: 'CLOUD_KITCHEN', label: 'Cloud Kitchens (3)' },
        ].map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              filterType === tab.id
                ? 'bg-maroon-900 text-white shadow-md'
                : 'bg-white text-charcoal-700 border border-cream-200 hover:border-gold-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Outlets Grid */}
      {loading ? (
        <div className="py-20 text-center text-charcoal-500">
          <div className="w-8 h-8 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Loading Hyderabad House locations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((outlet) => {
            const isCurrent = selectedOutlet?.id === outlet.id;
            return (
              <div
                key={outlet.id}
                className={`bg-white rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                  isCurrent
                    ? 'border-maroon-800 shadow-lg ring-2 ring-maroon-800/20'
                    : 'border-cream-200 hover:border-gold-400 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        outlet.type === 'CLOUD_KITCHEN'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {outlet.type === 'CLOUD_KITCHEN' ? 'Cloud Kitchen' : 'Dine-in / Takeaway'}
                      </span>
                      {outlet.currentWorkloadLevel === 'HIGH' && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                          High Rush
                        </span>
                      )}
                    </div>
                    {isCurrent && (
                      <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-base text-maroon-950 mt-3">
                    {outlet.name.replace('Hyderabad House - ', '')}
                  </h3>

                  <p className="text-xs text-charcoal-600 mt-1 line-clamp-2 leading-relaxed">
                    {outlet.address}
                  </p>

                  <div className="mt-4 pt-3 border-t border-cream-100 space-y-2 text-xs text-charcoal-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
                      <span>Guaranteed Dum Prep: <strong>{outlet.minPrepTimeMinutes} mins</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Navigation className="w-3.5 h-3.5 text-maroon-800 flex-shrink-0" />
                      <span>Delivery Radius: <strong>{outlet.deliveryRadiusKm} km</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-charcoal-500 flex-shrink-0" />
                      <span>{outlet.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-cream-100">
                  <button
                    type="button"
                    onClick={() => handleSelectAndOrder(outlet)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs active:scale-98 ${
                      isCurrent
                        ? 'bg-maroon-900 text-white hover:bg-maroon-950'
                        : 'bg-cream-100 hover:bg-gold-500 text-charcoal-900 hover:text-charcoal-950 border border-cream-300'
                    }`}
                  >
                    <span>{isCurrent ? 'Browse Menu' : 'Order From This Outlet'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OutletsPage;
