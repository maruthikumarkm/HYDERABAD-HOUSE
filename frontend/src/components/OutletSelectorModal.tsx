import React, { useState, useEffect } from 'react';
import { X, MapPin, Search, Navigation, Check, Clock, ShieldCheck } from 'lucide-react';
import { Outlet } from '../types';
import { useCart } from '../context/CartContext';
import api from '../services/api';

interface OutletSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OutletSelectorModal: React.FC<OutletSelectorModalProps> = ({ isOpen, onClose }) => {
  const { selectedOutlet, setSelectedOutlet } = useCart();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.get('/outlets')
        .then((res) => setOutlets(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setDetectionMessage('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setDetectionMessage('Detecting your location in Hyderabad...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.post('/outlets/nearest', {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          if (res.data?.outlet) {
            setSelectedOutlet(res.data.outlet);
            setDetectionMessage(`Nearest Outlet: ${res.data.outlet.name} (${res.data.distanceKm} km away)`);
          }
        } catch (e) {
          // Fallback to Kondapur default
          setDetectionMessage('Using default Hyderabad IT Corridor outlet (Kondapur)');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setDetectionMessage('Location access was denied. Please pick your outlet manually below.');
      }
    );
  };

  const filteredOutlets = outlets.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-cream-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-cream-200 flex items-center justify-between bg-cream-50">
          <div>
            <h3 className="font-serif font-bold text-lg text-maroon-900">Select Your Hyderabad Outlet</h3>
            <p className="text-xs text-charcoal-600">Choose from 14 Dine-in & 3 Cloud Kitchen outlets</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-cream-200 hover:bg-cream-300 text-charcoal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Location Auto-detect */}
        <div className="p-4 border-b border-cream-100 space-y-3 bg-white">
          <button
            type="button"
            onClick={handleDetectLocation}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-charcoal-900 rounded-xl text-xs font-bold shadow-xs active:scale-98 transition-all"
          >
            <Navigation className="w-4 h-4 text-maroon-900" />
            <span>Auto-detect Nearest Outlet</span>
          </button>

          {detectionMessage && (
            <div className="p-2.5 bg-gold-50 border border-gold-200 rounded-xl text-xs text-gold-900 font-medium">
              {detectionMessage}
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by area (e.g. Kondapur, Gachibowli, Banjara Hills)..."
              className="w-full pl-9 pr-4 py-2.5 bg-cream-50 rounded-xl border border-cream-200 text-xs focus:ring-2 focus:ring-maroon-800 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Outlet List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-cream-100">
          {filteredOutlets.map((outlet) => {
            const isSelected = selectedOutlet?.id === outlet.id;
            return (
              <div
                key={outlet.id}
                onClick={() => {
                  setSelectedOutlet(outlet);
                  onClose();
                }}
                className={`pt-2.5 first:pt-0 flex items-start justify-between p-3 rounded-2xl cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-maroon-50/70 border-maroon-800 shadow-xs'
                    : 'bg-white border-transparent hover:bg-cream-50 hover:border-cream-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      isSelected ? 'bg-maroon-800 text-gold-400' : 'bg-cream-100 text-maroon-800'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-serif font-bold text-sm text-charcoal-900">
                        {outlet.name.replace('Hyderabad House - ', '')}
                      </h4>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        outlet.type === 'CLOUD_KITCHEN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {outlet.type === 'CLOUD_KITCHEN' ? 'Cloud Kitchen' : 'Dine-in & Express'}
                      </span>
                    </div>

                    <p className="text-xs text-charcoal-600 mt-1 line-clamp-1">{outlet.address}</p>

                    <div className="flex items-center space-x-3 mt-1.5 text-[11px] text-charcoal-500 font-medium">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gold-600" />
                        <span>Prep: {outlet.minPrepTimeMinutes} mins</span>
                      </span>
                      <span>•</span>
                      <span>Radius: {outlet.deliveryRadiusKm} km</span>
                      <span>•</span>
                      <span>Min Order: ₹{outlet.minOrderAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-maroon-800 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OutletSelectorModal;
