import React, { useState } from 'react';
import { Plus, Flame, Clock, AlertCircle } from 'lucide-react';
import { MenuItem } from '../types';
import ItemCustomizerModal from './ItemCustomizerModal';

interface FoodCardProps {
  item: MenuItem;
}

export const FoodCard: React.FC<FoodCardProps> = ({ item }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const displayPrice = item.price !== undefined ? item.price : item.basePrice;
  const isAvailable = item.isAvailable !== false;

  const getSpiceBadge = (level: string) => {
    switch (level) {
      case 'EXTRA_SPICY':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-0.5"><Flame className="w-2.5 h-2.5 fill-red-600 text-red-600" /><span>Extra Spicy</span></span>;
      case 'SPICY':
        return <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-0.5"><Flame className="w-2.5 h-2.5 text-orange-600" /><span>Spicy</span></span>;
      case 'MEDIUM':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5 rounded">Medium</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-1.5 py-0.5 rounded">Mild</span>;
    }
  };

  return (
    <>
      <div className={`group bg-white rounded-2xl overflow-hidden border border-cream-200 hover:border-gold-400 hover:shadow-xl transition-all duration-300 flex flex-col h-full ${
        !isAvailable ? 'opacity-70 grayscale-[20%]' : ''
      }`}>
        {/* Food Image */}
        <div className="relative h-48 w-full overflow-hidden bg-cream-100">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/60 via-transparent to-transparent opacity-80" />

          {/* Veg / Non-Veg Icon */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs p-1 rounded-md shadow-xs">
            <div className={`w-3.5 h-3.5 border-2 ${item.isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center p-0.5`}>
              <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
            </div>
          </div>

          {/* Portion Size Tag */}
          <div className="absolute top-3 right-3 bg-charcoal-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
            {item.portionSize}
          </div>

          {/* Prep Time */}
          <div className="absolute bottom-2.5 left-3 flex items-center space-x-1 text-white text-[11px] font-medium">
            <Clock className="w-3.5 h-3.5 text-gold-400" />
            <span>~{item.prepTimeMinutes} mins</span>
          </div>

          {/* Out of Stock Overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-charcoal-950/80 backdrop-blur-xs flex items-center justify-center">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Out of Stock at this Outlet</span>
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              {getSpiceBadge(item.spiceLevel)}
              {item.categoryName && (
                <span className="text-[10px] uppercase font-semibold text-charcoal-500 tracking-wider">
                  {item.categoryName}
                </span>
              )}
            </div>

            <h3 className="font-serif font-bold text-base text-charcoal-900 group-hover:text-maroon-800 transition-colors line-clamp-1">
              {item.name}
            </h3>

            <p className="text-xs text-charcoal-600 mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>

            {item.allergenInfo && item.allergenInfo !== 'None' && (
              <p className="text-[10px] text-amber-700 mt-1.5 italic">
                Allergens: {item.allergenInfo}
              </p>
            )}
          </div>

          {/* Pricing & Add to Cart */}
          <div className="mt-4 pt-3 border-t border-cream-100 flex items-center justify-between">
            <div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-black text-maroon-900">₹{displayPrice}</span>
              </div>
              <span className="text-[10px] text-charcoal-500 font-medium">Includes 5% GST</span>
            </div>

            <button
              type="button"
              disabled={!isAvailable}
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all ${
                isAvailable
                  ? 'bg-maroon-800 hover:bg-maroon-900 text-white active:scale-95 hover:shadow-md'
                  : 'bg-cream-200 text-charcoal-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Customizer */}
      <ItemCustomizerModal
        item={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
