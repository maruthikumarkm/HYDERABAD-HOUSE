import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, MapPin, CheckCircle, Sparkles, Send } from 'lucide-react';
import { Outlet } from '../types';
import api from '../services/api';

export const PartyOrdersPage: React.FC = () => {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Minimum advance date is 2 days from today
  const minDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    customerName: '',
    phoneNumber: '',
    email: '',
    eventDate: minDate,
    eventTime: '19:30',
    numberOfGuests: 25,
    outletId: 1,
    foodSelectionsJson: 'Chicken Dum Biryani (Family Pack) × 5, Apollo Fish × 4, Double Ka Meetha × 25',
    estimatedBudget: 12000,
    specialInstructions: '',
  });

  useEffect(() => {
    api.get('/outlets').then((res) => setOutlets(res.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await api.post('/party-orders/submit', form);
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit party order inquiry.');
    }
  };

  return (
    <div className="min-h-screen py-12 max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs uppercase font-bold text-gold-700 tracking-widest bg-gold-50 px-3 py-1 rounded-full border border-gold-200">
          Royal Nizami Feasts
        </span>
        <h1 className="font-serif font-black text-3xl sm:text-4xl text-maroon-950">
          Party & Bulk Catering
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-600">
          From corporate luncheons to grand weddings. Freshly dum-cooked in authentic degs and served piping hot with live service options.
        </p>
      </div>

      {submitted ? (
        <div className="bg-white p-8 rounded-3xl border border-cream-200 shadow-xl text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="font-serif font-black text-2xl text-maroon-950">Inquiry Received!</h2>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            Thank you, <strong>{form.customerName}</strong>. Our Central Catering Manager has received your request for {form.numberOfGuests} guests on {form.eventDate}. We will contact you at {form.phoneNumber} within 2 hours with customized quote options.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="py-2.5 px-6 bg-maroon-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-3xl border border-cream-200 shadow-xl space-y-6 text-xs text-charcoal-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">Your Full Name / Organization</label>
              <input
                type="text"
                required
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="e.g. CyberTech Solutions / Rahul Sharma"
                className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Contact Phone Number</label>
              <input
                type="tel"
                required
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="events@company.com"
                className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Preferred Fulfilling Outlet</label>
              <select
                value={form.outletId}
                onChange={(e) => setForm({ ...form, outletId: Number(e.target.value) })}
                className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200 font-semibold"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name.replace('Hyderabad House - ', '')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold mb-1">Event Date (Min 48h Notice)</label>
              <input
                type="date"
                required
                min={minDate}
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Event Time</label>
              <input
                type="time"
                required
                value={form.eventTime}
                onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
                className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Expected Guests (Min 10)</label>
              <input
                type="number"
                min={10}
                required
                value={form.numberOfGuests}
                onChange={(e) => setForm({ ...form, numberOfGuests: Number(e.target.value) })}
                className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Food Selections / Packages Desired</label>
            <textarea
              rows={3}
              required
              value={form.foodSelectionsJson}
              onChange={(e) => setForm({ ...form, foodSelectionsJson: e.target.value })}
              placeholder="e.g. Chicken Biryani Family Packs, Mutton Haleem pots, Double Ka Meetha..."
              className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Special Requirements & Event Location</label>
            <input
              type="text"
              value={form.specialInstructions}
              onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })}
              placeholder="e.g. Live warmers needed, venue address in Gachibowli, extra mild spice for kids..."
              className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-maroon-900 to-black hover:from-black hover:to-maroon-900 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98"
          >
            <Send className="w-4 h-4 text-gold-400" />
            <span>Submit Party Catering Request</span>
          </button>
        </form>
      )}
    </div>
  );
};

export default PartyOrdersPage;
