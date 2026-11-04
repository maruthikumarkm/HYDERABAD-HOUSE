import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Search, 
  MapPin, 
  Sparkles, 
  Clock, 
  Award, 
  ChevronRight, 
  ShieldCheck,
  Star,
  Zap
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { MenuItem, MenuCategory } from '../types';
import { FoodCard } from '../components/FoodCard';
import api from '../services/api';

export const HomePage: React.FC = () => {
  const { selectedOutlet, orderType, setOrderType, addItem } = useCart();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVegOnly, setFilterVegOnly] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load categories & menu items
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/menu/categories'),
      selectedOutlet ? api.get(`/menu/outlet/${selectedOutlet.id}`) : api.get('/menu/items'),
      api.post('/ai/recommendations', { customer_id: 8, previous_item_ids: [1, 2] })
    ]).then(([catRes, itemRes, aiRes]) => {
      setCategories(catRes.data);
      setMenuItems(itemRes.data);
      if (aiRes.data) {
        setRecommendations(aiRes.data);
      }
    }).catch((err) => {
      console.error('Error fetching home data:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, [selectedOutlet]);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === null || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg = !filterVegOnly || item.isVeg;
    return matchesCategory && matchesSearch && matchesVeg;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Banner with Royal Nizami Theme */}
      <section className="relative bg-gradient-to-br from-maroon-950 via-maroon-900 to-charcoal-950 text-white py-16 sm:py-24 overflow-hidden border-b-4 border-gold-500">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gold-500/10 border border-gold-400/30 text-gold-300 text-xs font-semibold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                <span>Direct Platform • Zero Inflation Guarantee</span>
              </div>

              <h1 className="font-serif font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight">
                Authentic Nizami <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-200">
                  Dum Pukht Biryani
                </span>
              </h1>

              <p className="text-base sm:text-lg text-cream-200 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                Experience the 400-year legacy of royal Hyderabadi kitchens. Direct from our 14 outlets and 3 cloud kitchens to your dining table.
              </p>

              {/* Quick Action Pill Banner */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-medium text-cream-300 pt-2">
                <div className="flex items-center space-x-1.5 bg-white/5 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <Clock className="w-4 h-4 text-gold-400" />
                  <span>AI-Predicted ~25m Dum Fresh</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-white/5 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>5% GST Included</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-white/5 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10">
                  <Award className="w-4 h-4 text-gold-400" />
                  <span>GI-Tagged Haleem</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm rounded-3xl overflow-hidden shadow-2xl border-2 border-gold-500/40 transform hover:scale-102 transition-transform duration-500 bg-maroon-900/40">
                <img
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80"
                  alt="Hyderabadi Chicken Dum Biryani"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/20 to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4 text-white p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gold-400 tracking-wider">Chef Special</span>
                      <h4 className="font-serif font-bold text-base">Royal Chicken Dum Biryani</h4>
                      <p className="text-xs text-cream-300">Serves 1-2 • Saffron & Desi Ghee</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-gold-300">₹360</span>
                      <p className="text-[10px] text-cream-400">incl. 5% GST</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Recommendation Carousel / Quick Strip */}
      {recommendations.length > 0 && (
        <section className="bg-gold-50/70 border-b border-gold-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-gold-500 text-charcoal-900 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-charcoal-900">AI-Powered Pairings</h3>
                  <p className="text-xs text-charcoal-600">Frequently ordered together by Hyderabadi biryani lovers</p>
                </div>
              </div>
              <span className="text-xs font-bold text-maroon-900 hidden sm:inline">Smart Re-order Engine</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {recommendations.map((rec) => (
                <div key={rec.menu_item_id} className="bg-white p-3 rounded-2xl border border-gold-200 shadow-xs flex items-center justify-between">
                  <div>
                    <h5 className="font-serif font-bold text-xs text-charcoal-900">{rec.name}</h5>
                    <span className="text-[10px] text-gold-800 font-semibold">{rec.reason}</span>
                  </div>
                  <a
                    href="#menu"
                    className="p-1.5 bg-cream-100 hover:bg-gold-500 text-charcoal-800 hover:text-charcoal-950 rounded-lg transition-colors text-xs font-bold"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Menu Section */}
      <section id="menu" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search & Veg Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-cream-200">
          <div>
            <h2 className="font-serif font-black text-2xl sm:text-3xl text-maroon-950">
              Royal Nizami Food Menu
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-600 mt-1">
              Serving fresh from: <strong className="text-maroon-900">{selectedOutlet ? selectedOutlet.name : 'All Hyderabad Outlets'}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search Bar */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search biryani, haleem, kebabs..."
                className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-cream-300 text-xs focus:ring-2 focus:ring-maroon-800 focus:outline-hidden shadow-xs"
              />
            </div>

            {/* Veg Only Toggle */}
            <button
              type="button"
              onClick={() => setFilterVegOnly(!filterVegOnly)}
              className={`flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                filterVegOnly
                  ? 'bg-green-700 text-white border-green-700 shadow-sm'
                  : 'bg-white text-charcoal-700 border-cream-300 hover:border-green-600'
              }`}
            >
              <div className={`w-3 h-3 border-2 ${filterVegOnly ? 'border-white' : 'border-green-600'} flex items-center justify-center p-0.5`}>
                <div className={`w-1.5 h-1.5 rounded-full ${filterVegOnly ? 'bg-white' : 'bg-green-600'}`} />
              </div>
              <span>Pure Veg</span>
            </button>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="py-6 flex items-center space-x-2 overflow-x-auto pb-4 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              selectedCategory === null
                ? 'bg-maroon-900 text-white shadow-md'
                : 'bg-white text-charcoal-700 border border-cream-200 hover:border-gold-400'
            }`}
          >
            All Items ({menuItems.length})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-maroon-900 text-white shadow-md'
                    : 'bg-white text-charcoal-700 border border-cream-200 hover:border-gold-400'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Dishes Grid */}
        {loading ? (
          <div className="py-20 text-center text-charcoal-500">
            <div className="w-10 h-10 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Preparing fresh menu items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-charcoal-500 space-y-2">
            <Flame className="w-10 h-10 mx-auto text-cream-300" />
            <p className="text-base font-bold text-charcoal-800">No dishes found matching your search</p>
            <p className="text-xs text-charcoal-500">Try adjusting your filters or category selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
