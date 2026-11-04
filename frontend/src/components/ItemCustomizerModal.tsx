import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Flame, Check } from 'lucide-react';
import { MenuItem, AddOn } from '../types';
import { useCart } from '../context/CartContext';
import api from '../services/api';

interface ItemCustomizerModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
}

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({ item, isOpen, onClose }) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [portionSize, setPortionSize] = useState(item.portionSize || 'Regular');
  const [spiceLevel, setSpiceLevel] = useState(item.spiceLevel || 'MEDIUM');
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const basePrice = item.price !== undefined ? item.price : item.basePrice;

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setPortionSize(item.portionSize || 'Regular');
      setSpiceLevel(item.spiceLevel || 'MEDIUM');
      setSelectedAddOns([]);
      setSpecialInstructions('');

      // Fetch add-ons
      api.get(`/menu/items/${item.id}/add-ons`)
        .then((res) => setAvailableAddOns(res.data))
        .catch(() => setAvailableAddOns([]));
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  const toggleAddOn = (addon: AddOn) => {
    if (selectedAddOns.some((a) => a.id === addon.id)) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + Number(a.price), 0);
  const itemTotal = (basePrice + addOnsTotal) * quantity;

  const handleAddToCart = () => {
    addItem(item, quantity, portionSize, spiceLevel, selectedAddOns, specialInstructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-cream-200 flex flex-col max-h-[90vh]">
        {/* Header with image */}
        <div className="relative h-44 w-full bg-cream-100 flex-shrink-0">
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-charcoal-950/30 to-transparent" />
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 text-charcoal-900 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span className="text-[10px] uppercase font-bold text-gold-400 tracking-wider">Customize Your Dish</span>
            <h3 className="font-serif font-bold text-lg leading-tight truncate">{item.name}</h3>
            <p className="text-xs text-cream-200">Base Price: ₹{basePrice} (incl. 5% GST)</p>
          </div>
        </div>

        {/* Scrollable Customization Options */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 divide-y divide-cream-100 text-charcoal-900">
          {/* Spice Level Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-2.5">
              Select Spice Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'MILD', label: 'Mild', icon: '🌿' },
                { id: 'MEDIUM', label: 'Medium', icon: '🌶️' },
                { id: 'SPICY', label: 'Spicy', icon: '🔥' },
                { id: 'EXTRA_SPICY', label: 'Nizami Hot', icon: '⚡' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setSpiceLevel(opt.id as any)}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    spiceLevel === opt.id
                      ? 'bg-maroon-800 text-white border-maroon-800 shadow-xs'
                      : 'bg-cream-50 text-charcoal-700 border-cream-200 hover:border-gold-400'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          {availableAddOns.length > 0 && (
            <div className="pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-2.5">
                Royal Sides & Add-ons
              </label>
              <div className="space-y-2">
                {availableAddOns.map((addon) => {
                  const isChecked = selectedAddOns.some((a) => a.id === addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddOn(addon)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-gold-50/70 border-gold-500 shadow-xs'
                          : 'bg-cream-50/60 border-cream-200 hover:border-cream-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-gold-600 border-gold-600 text-white' : 'border-cream-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium text-charcoal-800">{addon.name}</span>
                      </div>
                      <span className="text-xs font-bold text-maroon-900">+₹{addon.price}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="pt-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Chef Instructions (Optional)
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Extra spicy salan, pack raita separately, less oil..."
              className="w-full px-3.5 py-2.5 bg-cream-50 rounded-xl border border-cream-200 text-xs focus:ring-2 focus:ring-maroon-800 focus:outline-hidden transition-all"
              maxLength={150}
            />
          </div>
        </div>

        {/* Footer with quantity and Add to Cart */}
        <div className="p-4 bg-cream-50 border-t border-cream-200 flex items-center justify-between">
          {/* Quantity Stepper */}
          <div className="flex items-center space-x-3 bg-white px-3 py-1.5 rounded-xl border border-cream-200 shadow-xs">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-1 rounded-md text-charcoal-600 hover:bg-cream-100 active:scale-95"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-black w-4 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="p-1 rounded-md text-charcoal-600 hover:bg-cream-100 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 ml-4 py-3 px-5 bg-gradient-to-r from-maroon-800 to-maroon-900 hover:from-maroon-900 hover:to-maroon-950 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-between active:scale-95"
          >
            <span>Add to Order</span>
            <span className="text-gold-300 font-black text-sm">₹{itemTotal}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemCustomizerModal;
