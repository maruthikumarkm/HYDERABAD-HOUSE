export type Role = 'CUSTOMER' | 'KITCHEN_STAFF' | 'OUTLET_MANAGER' | 'CENTRAL_ADMIN' | 'DELIVERY_STAFF' | 'CATERING_MANAGER';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  outletId?: number;
  loyaltyPoints?: number;
}

export interface Outlet {
  id: number;
  name: string;
  code: string;
  type: 'DINE_IN_TAKEAWAY' | 'CLOUD_KITCHEN';
  address: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
  minOrderAmount: number;
  minPrepTimeMinutes: number;
  currentWorkloadLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  isActive: boolean;
  phone: string;
}

export interface MenuCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  imageUrl: string;
  isActive: boolean;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  description: string;
  basePrice: number;
  price?: number; // Outlet-specific price
  isVeg: boolean;
  spiceLevel: 'MILD' | 'MEDIUM' | 'SPICY' | 'EXTRA_SPICY';
  portionSize: string;
  imageUrl: string;
  allergenInfo?: string;
  prepTimeMinutes: number;
  isActive?: boolean;
  isAvailable?: boolean; // Outlet-specific availability
  isFeatured?: boolean;
}

export interface AddOn {
  id: number;
  menuItemId?: number;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  portionSize: string;
  spiceLevel: string;
  selectedAddOns: AddOn[];
  specialInstructions?: string;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'READY_FOR_PICKUP'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RIDER_HANDOFF'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItemDetail {
  id: number;
  itemName: string;
  quantity: number;
  portionSize: string;
  unitPrice: number;
  spiceLevel: string;
  specialInstructions?: string;
  addOnsJson?: string;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  outlet: Outlet;
  orderType: 'DELIVERY' | 'PICKUP' | 'PARTY_BULK' | string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  loyaltyDiscount: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentMethod: 'UPI' | 'CARD' | 'CASH' | string;
  deliveryAddress?: string;
  customerName: string;
  customerPhone: string;
  specialInstructions?: string;
  promisedPrepTimeMinutes: number;
  estimatedReadyTime: string;
  placedAt: string;
  confirmedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  handedOffAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  isLate: boolean;
  deliveryStaff?: {
    id: number;
    name: string;
    phone: string;
    availabilityStatus?: string;
  };
  partyDetails?: {
    eventType?: string;
    eventDate?: string;
    eventTime?: string;
    guestCount?: number;
    specialInstructions?: string;
    contactName?: string;
    contactPhone?: string;
    deliveryAddress?: string;
  };
  items: OrderItemDetail[];
}

export interface OrderStatusHistory {
  id: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
}

export interface Coupon {
  id: number;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
}

export interface PartyOrder {
  id: number;
  customerName: string;
  phoneNumber: string;
  email: string;
  eventDate: string;
  eventTime: string;
  numberOfGuests: number;
  outlet: Outlet;
  foodSelectionsJson: string;
  estimatedBudget?: number;
  specialInstructions?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONFIRMED' | 'COMPLETED';
  cateringManagerNotes?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}
