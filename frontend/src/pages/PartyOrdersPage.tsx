import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Clock, 
  MapPin, 
  CheckCircle, 
  Send, 
  Plus, 
  Trash2, 
  UtensilsCrossed,
  Sparkles,
  AlertCircle,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { Outlet, MenuItem } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface SelectedCateringDish {
  menuItemId: number;
  name: string;
  quantity: number;
  portionSize: string;
  unitPrice: number;
}

export const PartyOrdersPage: React.FC = () => {
  const { addPartyOrderToCart, setSelectedOutlet } = useCart();
  const { user } = useAuth();

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Minimum advance date is 2 days from today
  const minDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Auto-fill from authenticated customer
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [eventDate, setEventDate] = useState(minDate);
  const [eventTime, setEventTime] = useState('19:30');
  const [numberOfGuests, setNumberOfGuests] = useState<number | ''>(25);
  const [selectedOutletId, setSelectedOutletId] = useState<number>(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Dynamic dishes selected by customer
  const [selectedDishes, setSelectedDishes] = useState<SelectedCateringDish[]>([]);
  const [currentDishId, setCurrentDishId] = useState<number>(0);
  const [currentQty, setCurrentQty] = useState<number>(10);

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!phoneNumber && user.phone) setPhoneNumber(user.phone);
      if (!email) setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    // Load active outlets
    api.get('/outlets')
      .then((res) => {
        setOutlets(res.data);
        if (res.data.length > 0) setSelectedOutletId(res.data[0].id);
      })
      .catch((err) => console.error('Failed to load outlets', err));

    // Load authentic menu items for dynamic selection
    api.get('/menu/items')
      .then((res) => {
        setMenuItems(res.data);
        if (res.data.length > 0) setCurrentDishId(res.data[0].id);
      })
      .catch((err) => console.error('Failed to load menu items', err));
  }, []);

  const handleAddDish = () => {
    if (!currentDishId || currentQty <= 0) return;
    const item = menuItems.find((m) => m.id === currentDishId);
    if (!item) return;

    // Check if item already exists in selected list
    const existingIndex = selectedDishes.findIndex((d) => d.menuItemId === item.id);
    if (existingIndex > -1) {
      const updated = [...selectedDishes];
      updated[existingIndex].quantity += currentQty;
      setSelectedDishes(updated);
    } else {
      setSelectedDishes([
        ...selectedDishes,
        {
          menuItemId: item.id,
          name: item.name,
          quantity: currentQty,
          portionSize: item.portionSize,
          unitPrice: item.basePrice,
        },
      ]);
    }
  };

  const handleRemoveDish = (index: number) => {
    setSelectedDishes(selectedDishes.filter((_, i) => i !== index));
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveDish(index);
      return;
    }
    const updated = [...selectedDishes];
    updated[index].quantity = newQty;
    setSelectedDishes(updated);
  };

  const estimatedTotalBudget = selectedDishes.reduce(
    (sum, d) => sum + d.unitPrice * d.quantity,
    0
  );

  const handleAddToCartAndProceed = () => {
    setErrorMsg(null);

    if (selectedDishes.length === 0) {
      setErrorMsg('Please select at least one dish from the menu catalog for your catering feast.');
      return;
    }

    if (!numberOfGuests || Number(numberOfGuests) < 10) {
      setErrorMsg('Please specify expected guests (minimum 10 persons for party feast).');
      return;
    }

    const targetOutlet = outlets.find((o) => o.id === selectedOutletId) || outlets[0];
    if (targetOutlet) {
      setSelectedOutlet(targetOutlet);
    }

    const partyItems = selectedDishes.map((d) => {
      const originalMenuItem = menuItems.find((m) => m.id === d.menuItemId) || ({
        id: d.menuItemId,
        categoryId: 1,
        name: d.name,
        description: 'Authentic royal dish for party feast',
        basePrice: d.unitPrice,
        price: d.unitPrice,
        isVeg: false,
        spiceLevel: 'MEDIUM',
        portionSize: d.portionSize,
        imageUrl: '/images/dishes/chicken_biryani.jpg',
        prepTimeMinutes: 30,
      } as MenuItem);

      return {
        menuItem: originalMenuItem,
        quantity: d.quantity,
      };
    });

    addPartyOrderToCart(partyItems, {
      eventType: 'Party Feast',
      eventDate,
      eventTime,
      guestCount: Number(numberOfGuests),
      deliveryAddress: specialInstructions.trim() || `${targetOutlet?.name || 'Kondapur'} delivery area`,
      specialInstructions: specialInstructions.trim(),
      contactName: customerName.trim() || user?.name || 'Customer',
      contactPhone: phoneNumber.trim() || user?.phone || '+919876543210',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedDishes.length === 0) {
      setErrorMsg('Please select at least one dish from the menu catalog for your catering request.');
      return;
    }

    if (!numberOfGuests || numberOfGuests < 10) {
      setErrorMsg('Please specify expected guests (minimum 10 persons for bulk catering).');
      return;
    }

    const foodSelectionsString = selectedDishes
      .map((d) => `${d.name} (${d.portionSize}) × ${d.quantity}`)
      .join(', ');

    const payload = {
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      eventDate,
      eventTime,
      numberOfGuests: Number(numberOfGuests),
      outletId: selectedOutletId,
      foodSelectionsJson: foodSelectionsString,
      estimatedBudget: estimatedTotalBudget > 0 ? estimatedTotalBudget : null,
      specialInstructions: specialInstructions.trim(),
    };

    try {
      await api.post('/party-orders/submit', payload);
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit party catering inquiry.');
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
          <h2 className="font-serif font-black text-2xl text-maroon-950">Catering Inquiry Received!</h2>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            Thank you, <strong>{customerName}</strong>. Our Central Catering Desk has received your request for <strong>{numberOfGuests} guests</strong> on <strong>{eventDate}</strong>.
          </p>

          <div className="bg-cream-50 p-4 rounded-2xl border border-cream-200 text-left text-xs space-y-1.5">
            <span className="font-bold text-charcoal-800 block text-[11px] uppercase tracking-wider">
              Selected Menu Items ({selectedDishes.length}):
            </span>
            {selectedDishes.map((d, i) => (
              <div key={i} className="flex justify-between text-charcoal-700">
                <span>{d.name} ({d.portionSize})</span>
                <span className="font-bold">× {d.quantity}</span>
              </div>
            ))}
            {estimatedTotalBudget > 0 && (
              <div className="pt-2 border-t border-cream-200 flex justify-between font-bold text-maroon-900">
                <span>Estimated Menu Value</span>
                <span>₹{estimatedTotalBudget}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-charcoal-500">
            Our Catering Manager will contact you at <strong>{phoneNumber}</strong> within 2 hours.
          </p>

          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setSelectedDishes([]);
              setCustomerName('');
              setPhoneNumber('');
              setEmail('');
              setNumberOfGuests('');
              setSpecialInstructions('');
            }}
            className="py-2.5 px-6 bg-maroon-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-3xl border border-cream-200 shadow-xl space-y-6 text-xs text-charcoal-800">
          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">Your Full Name / Organization</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. CyberTech Solutions / Rahul Sharma"
                className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Contact Phone Number</label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="events@company.com"
                className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Preferred Fulfilling Outlet</label>
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(Number(e.target.value))}
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
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Event Time</label>
              <input
                type="time"
                required
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Expected Guests (Min 10)</label>
              <input
                type="number"
                min={10}
                required
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 50"
                className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200 font-semibold"
              />
            </div>
          </div>

          {/* DYNAMIC FOOD SELECTION FROM REAL MENU */}
          <div className="space-y-3 pt-2 border-t border-cream-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-bold text-sm text-maroon-950">
                  Select Catering Food & Portions
                </label>
                <p className="text-[11px] text-charcoal-500">
                  Choose authentic dishes from the catalog and specify required portion counts
                </p>
              </div>
              <span className="text-[11px] font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded-md border border-gold-200">
                Live Catalog
              </span>
            </div>

            {/* Dish Adder Controls */}
            <div className="bg-cream-50 p-4 rounded-2xl border border-cream-200 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <label className="block text-[10px] uppercase font-bold text-charcoal-600 mb-1">
                  Menu Item
                </label>
                <select
                  value={currentDishId}
                  onChange={(e) => setCurrentDishId(Number(e.target.value))}
                  className="w-full p-2.5 bg-white rounded-xl border border-cream-300 text-xs font-semibold text-charcoal-900"
                >
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.portionSize}) — ₹{item.basePrice}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-28">
                <label className="block text-[10px] uppercase font-bold text-charcoal-600 mb-1">
                  Quantity / Degs
                </label>
                <input
                  type="number"
                  min={1}
                  value={currentQty}
                  onChange={(e) => setCurrentQty(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 bg-white rounded-xl border border-cream-300 text-xs font-bold text-center"
                />
              </div>

              <div className="w-full sm:w-auto self-end">
                <button
                  type="button"
                  onClick={handleAddDish}
                  className="w-full sm:w-auto px-4 py-2.5 bg-maroon-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Menu</span>
                </button>
              </div>
            </div>

            {/* Selected Dishes Table / List */}
            {selectedDishes.length === 0 ? (
              <div className="p-6 bg-white border border-dashed border-cream-300 rounded-2xl text-center space-y-1 text-charcoal-500">
                <UtensilsCrossed className="w-8 h-8 text-cream-300 mx-auto" />
                <p className="text-xs font-semibold text-charcoal-700">No dishes selected yet</p>
                <p className="text-[11px] text-charcoal-400">
                  Select a dish from the dropdown above and click "Add to Menu" to build your feast.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden divide-y divide-cream-100 shadow-2xs">
                {selectedDishes.map((dish, idx) => (
                  <div key={idx} className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <span className="font-bold text-charcoal-900">{dish.name}</span>
                      <span className="text-[11px] text-charcoal-500 block">
                        {dish.portionSize} • ₹{dish.unitPrice} each
                      </span>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center space-x-2 bg-cream-50 px-2 py-1 rounded-lg border border-cream-200">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, dish.quantity - 1)}
                        className="p-1 hover:text-maroon-800 text-charcoal-500"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold">{dish.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, dish.quantity + 1)}
                        className="p-1 hover:text-maroon-800 text-charcoal-500"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right w-20">
                      <span className="font-bold text-maroon-900">
                        ₹{dish.unitPrice * dish.quantity}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDish(idx)}
                      className="p-1 text-charcoal-400 hover:text-red-600 transition-colors"
                      title="Remove dish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Subtotal Footer */}
                <div className="p-3 bg-cream-50 flex items-center justify-between text-xs font-bold text-maroon-950">
                  <span>Estimated Food Value:</span>
                  <span className="text-sm font-black">₹{estimatedTotalBudget}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold mb-1">Special Requirements & Event Location</label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Live warmers needed, venue address in Gachibowli, extra mild spice for kids..."
              className="w-full p-3 bg-cream-50 rounded-xl border border-cream-200"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleAddToCartAndProceed}
              className="w-full py-4 bg-gradient-to-r from-maroon-900 to-black hover:from-black hover:to-maroon-900 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98"
            >
              <ShoppingBag className="w-4 h-4 text-gold-400" />
              <span>Add Party Feast to Cart & Proceed to Checkout (₹{estimatedTotalBudget})</span>
              <ArrowRight className="w-4 h-4 text-gold-400" />
            </button>

            <button
              type="submit"
              className="w-full py-2.5 bg-white hover:bg-cream-50 text-charcoal-700 font-bold text-xs rounded-xl border border-cream-300 transition-all flex items-center justify-center space-x-2"
            >
              <Send className="w-3.5 h-3.5 text-charcoal-500" />
              <span>Or Submit Inquiry for Custom Banquet Quote</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PartyOrdersPage;
