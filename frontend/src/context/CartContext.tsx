import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem, AddOn, Outlet } from '../types';
import api from '../services/api';

export interface PartyDetailsState {
  eventType: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  deliveryAddress: string;
  specialInstructions?: string;
  contactName?: string;
  contactPhone?: string;
}

interface CartContextType {
  items: CartItem[];
  selectedOutlet: Outlet | null;
  orderType: 'DELIVERY' | 'PICKUP';
  isCartOpen: boolean;
  couponCode: string;
  couponDiscount: number;
  pointsToRedeem: number;
  loyaltyDiscount: number;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  totalAmount: number;
  isPartyOrder: boolean;
  partyDetails: PartyDetailsState | null;
  setSelectedOutlet: (outlet: Outlet) => void;
  setOrderType: (type: 'DELIVERY' | 'PICKUP') => void;
  setIsCartOpen: (open: boolean) => void;
  addItem: (item: MenuItem, quantity: number, portionSize: string, spiceLevel: string, addOns: AddOn[], instructions?: string) => void;
  addPartyOrderToCart: (partyItems: { menuItem: MenuItem; quantity: number }[], details: PartyDetailsState) => void;
  setPartyOrderDetails: (details: PartyDetailsState | null) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  setPointsToRedeem: (points: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedOutlet, setSelectedOutletState] = useState<Outlet | null>(() => {
    const saved = localStorage.getItem('selected_outlet');
    return saved ? JSON.parse(saved) : null;
  });

  const [orderType, setOrderTypeState] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [pointsToRedeem, setPointsToRedeemState] = useState(0);

  const [partyDetails, setPartyDetails] = useState<PartyDetailsState | null>(() => {
    const saved = localStorage.getItem('party_details');
    return saved ? JSON.parse(saved) : null;
  });

  const isPartyOrder = partyDetails !== null;

  useEffect(() => {
    if (partyDetails) {
      localStorage.setItem('party_details', JSON.stringify(partyDetails));
    } else {
      localStorage.removeItem('party_details');
    }
  }, [partyDetails]);

  const addPartyOrderToCart = (
    partyItems: { menuItem: MenuItem; quantity: number }[],
    details: PartyDetailsState
  ) => {
    const newCartItems: CartItem[] = partyItems.map((pi) => {
      const unitPrice = pi.menuItem.price !== undefined ? pi.menuItem.price : pi.menuItem.basePrice;
      return {
        menuItem: pi.menuItem,
        quantity: pi.quantity,
        portionSize: 'Party Feast Pack',
        spiceLevel: 'MEDIUM',
        selectedAddOns: [],
        specialInstructions: `Party Order for ${details.guestCount} guests on ${details.eventDate} at ${details.eventTime}`,
        unitPrice,
        totalPrice: unitPrice * pi.quantity,
      };
    });

    setPartyDetails(details);
    setItems(newCartItems);
    setIsCartOpen(true);
  };

  const setPartyOrderDetails = (details: PartyDetailsState | null) => {
    setPartyDetails(details);
  };

  // Auto load first outlet if none selected
  useEffect(() => {
    if (!selectedOutlet) {
      api.get('/outlets')
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setSelectedOutlet(res.data[0]);
          }
        })
        .catch(() => {});
    }
  }, [selectedOutlet]);

  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(items));
  }, [items]);

  const setSelectedOutlet = (outlet: Outlet) => {
    setSelectedOutletState(outlet);
    localStorage.setItem('selected_outlet', JSON.stringify(outlet));
  };

  const setOrderType = (type: 'DELIVERY' | 'PICKUP') => {
    setOrderTypeState(type);
  };

  const addItem = (
    menuItem: MenuItem,
    quantity: number,
    portionSize: string,
    spiceLevel: string,
    addOns: AddOn[],
    instructions?: string
  ) => {
    const unitPrice = menuItem.price !== undefined ? menuItem.price : menuItem.basePrice;
    const addOnsTotal = addOns.reduce((sum, a) => sum + Number(a.price), 0);
    const itemTotal = (unitPrice + addOnsTotal) * quantity;

    const newItem: CartItem = {
      menuItem,
      quantity,
      portionSize,
      spiceLevel,
      selectedAddOns: addOns,
      specialInstructions: instructions,
      unitPrice: unitPrice + addOnsTotal,
      totalPrice: itemTotal,
    };

    setItems((prev) => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const unitBase = item.unitPrice;
          return {
            ...item,
            quantity,
            totalPrice: unitBase * quantity,
          };
        }
        return item;
      })
    );
  };

  // Subtotal calculation
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // 5% GST included in menu price display or broken down:
  // taxAmount = subtotal * 5 / 105
  const taxAmount = Math.round((subtotal * 5 / 105) * 100) / 100;

  // Delivery fee: ₹0 for orders >= ₹499 or for Takeaway; otherwise ₹40
  const deliveryFee = orderType === 'DELIVERY' && items.length > 0
    ? (subtotal >= 499 ? 0 : 40)
    : 0;

  const loyaltyDiscount = Math.min(pointsToRedeem, Math.floor(subtotal * 0.5));

  const totalAmount = Math.max(0, subtotal + deliveryFee - couponDiscount - loyaltyDiscount);

  const applyCoupon = async (code: string) => {
    try {
      const res = await api.post('/coupons/validate', {
        code,
        subtotal,
      });
      if (res.data.valid) {
        setCouponCode(res.data.code);
        setCouponDiscount(Number(res.data.discountAmount));
        return { success: true, message: `Applied! ₹${res.data.discountAmount} discount.` };
      }
      return { success: false, message: 'Invalid coupon code' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.error || 'Failed to apply coupon',
      };
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
  };

  const setPointsToRedeem = (points: number) => {
    setPointsToRedeemState(points);
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode('');
    setCouponDiscount(0);
    setPointsToRedeemState(0);
    setPartyDetails(null);
    localStorage.removeItem('cart_items');
    localStorage.removeItem('party_details');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        selectedOutlet,
        orderType,
        isCartOpen,
        couponCode,
        couponDiscount,
        pointsToRedeem,
        loyaltyDiscount,
        subtotal,
        taxAmount,
        deliveryFee,
        totalAmount,
        isPartyOrder,
        partyDetails,
        setSelectedOutlet,
        setOrderType,
        setIsCartOpen,
        addItem,
        addPartyOrderToCart,
        setPartyOrderDetails,
        removeItem,
        updateQuantity,
        applyCoupon,
        removeCoupon,
        setPointsToRedeem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
