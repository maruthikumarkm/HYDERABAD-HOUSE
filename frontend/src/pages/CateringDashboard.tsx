import React, { useState, useEffect } from 'react';
import { Calendar, Users, Check, X, Clock, MapPin, Send } from 'lucide-react';
import { PartyOrder } from '../types';
import api from '../services/api';

export const CateringDashboard: React.FC = () => {
  const [partyOrders, setPartyOrders] = useState<PartyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<PartyOrder | null>(null);
  const [quoteNotes, setQuoteNotes] = useState('');

  const loadPartyOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/party-orders');
      setPartyOrders(res.data);
    } catch (err) {
      console.error('Failed to load party orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartyOrders();
  }, []);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await api.patch(`/party-orders/${orderId}/status`, {
        status,
        notes: quoteNotes || `Status updated to ${status} by Catering Manager`,
      });
      setActiveOrder(null);
      setQuoteNotes('');
      loadPartyOrders();
    } catch (err) {
      console.error('Failed to update party order', err);
    }
  };

  const renderDishes = (foodData: string) => {
    if (!foodData) return null;

    try {
      const parsed = JSON.parse(foodData);
      if (Array.isArray(parsed)) {
        return (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {parsed.map((dish: any, idx: number) => {
              const name = dish.item || dish.name || dish.dish || (typeof dish === 'string' ? dish : JSON.stringify(dish));
              const qty = dish.qty || dish.quantity || dish.count;
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-maroon-50 text-maroon-950 border border-maroon-200/70 shadow-2xs"
                >
                  <span className="font-medium">{name}</span>
                  {qty !== undefined && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-maroon-800 text-white rounded-md tracking-wide">
                      × {qty}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        );
      }
    } catch (e) {
      // Not JSON format
    }

    const items = foodData.split(',').map((s) => s.trim()).filter(Boolean);
    if (items.length > 1) {
      return (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {items.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-maroon-50 text-maroon-950 border border-maroon-200/70 shadow-2xs"
            >
              {item}
            </span>
          ))}
        </div>
      );
    }

    return (
      <p className="mt-1 text-xs font-medium text-charcoal-800 bg-cream-50 p-2.5 rounded-xl border border-cream-200">
        {foodData}
      </p>
    );
  };

  return (
    <div className="min-h-screen py-8 max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm">
        <span className="text-xs font-bold text-gold-700 uppercase tracking-widest bg-gold-50 px-2.5 py-0.5 rounded-full border border-gold-200">
          Catering Management
        </span>
        <h1 className="font-serif font-black text-2xl text-maroon-950 mt-1">
          Party & Bulk Catering Inquiries
        </h1>
        <p className="text-xs text-charcoal-500">Review guest requirements, approve dates, and coordinate deg preparation with outlets</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-charcoal-500">
          <div className="w-8 h-8 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Loading catering requests...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {partyOrders.map((po) => (
            <div key={po.id} className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base text-maroon-950">{po.customerName}</h3>
                    <p className="text-xs text-charcoal-600">{po.phoneNumber} • {po.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    po.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    po.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {po.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-cream-50 p-3 rounded-2xl border border-cream-200 text-charcoal-700">
                  <div>
                    <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Event Date</span>
                    <strong>{po.eventDate} at {po.eventTime}</strong>
                  </div>
                  <div>
                    <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Guests</span>
                    <strong>{po.numberOfGuests} Persons</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-cream-200">
                    <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Fulfilling Outlet</span>
                    <strong>{po.outlet.name}</strong>
                  </div>
                </div>

                <div className="mt-3 text-xs text-charcoal-700">
                  <span className="font-bold text-charcoal-900 block mb-0.5">Dishes Desired:</span>
                  {renderDishes(po.foodSelectionsJson)}
                </div>

                {po.specialInstructions && (
                  <p className="mt-2 text-xs text-maroon-800 italic">
                    Note: {po.specialInstructions}
                  </p>
                )}

                {po.cateringManagerNotes && (
                  <div className="mt-2 p-2 bg-gold-50 border border-gold-200 rounded-xl text-xs text-gold-900">
                    <strong>Manager Note:</strong> {po.cateringManagerNotes}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {po.status === 'PENDING' && (
                <div className="pt-3 border-t border-cream-100 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(po.id, 'APPROVED')}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Inquiry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(po.id, 'REJECTED')}
                    className="px-4 py-2.5 bg-cream-200 hover:bg-red-100 hover:text-red-700 text-charcoal-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CateringDashboard;
