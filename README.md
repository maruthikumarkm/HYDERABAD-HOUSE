# HYDERABAD HOUSE 🍽️

A full-stack restaurant ordering and management platform for Hyderabad House, designed to connect customers, kitchen staff, outlet managers, delivery staff, and central administration through a single real-time order workflow.

## 🚀 Features

### 👤 Customer
- User registration and login
- Browse restaurant menu
- Add items to cart
- Regular food orders
- Party/Bulk orders
- Checkout and payment
- Order history
- Live order tracking
- Delivery status tracking

### 👨‍🍳 Kitchen Staff
- Kitchen Display System (KDS)
- View incoming orders
- Accept and prepare orders
- Update order status
- Handle regular orders
- Handle Party/Bulk and catering orders
- Mark orders as ready

### 🏪 Outlet Manager
- Manage outlet operations
- Monitor orders
- View ready orders
- Assign delivery orders to available Delivery Staff
- Monitor delivery progress
- View outlet-level order activity

### 🛵 Delivery Staff
- Secure account login
- View assigned delivery orders
- Accept assigned orders
- Pick up orders
- Mark orders as out for delivery
- Mark orders as delivered
- View completed deliveries

### 🏢 Central Admin
- Centralized administration
- Monitor outlets
- Monitor orders
- View operational analytics
- Manage platform-level operations

## 🔄 Order Workflow

```text
Customer
   ↓
Place Order
   ↓
Database
   ↓
Kitchen Staff
   ↓
Prepare Order
   ↓
Order Ready
   ↓
Outlet Manager
   ↓
Assign Delivery Staff
   ↓
Delivery Staff
   ↓
Pick Up
   ↓
Out for Delivery
   ↓
Delivered
   ↓
Customer
```

## 🛒 Party/Bulk Orders

Party/Bulk orders are integrated into the same order system as regular orders.

```text
Party/Bulk Order
      ↓
     Cart
      ↓
   Checkout
      ↓
   Payment
      ↓
Database Order
      ↓
Kitchen Staff
      ↓
Outlet Manager
      ↓
Delivery Staff
      ↓
Customer Tracking
```

All orders use a single persistent order record as the source of truth.

## 🔐 Authentication & Authorization

The platform uses role-based authentication.

### Active Roles

- `CUSTOMER`
- `KITCHEN_STAFF`
- `OUTLET_MANAGER`
- `CENTRAL_ADMIN`
- `DELIVERY_STAFF`

Role selection does not automatically log a user in. Users must have a valid registered account and authenticate using their credentials.

Backend authorization controls access to role-specific functionality.

## 🏗️ Technology Stack

### Frontend
- React
- TypeScript
- Vite
- HTML
- CSS
- JavaScript

### Backend
- Java
- Spring Boot
- REST APIs
- JDBC

### Database
- MySQL

### AI Service
- Python
- FastAPI

### Other Technologies
- Git
- GitHub
- REST APIs
- WebSocket/real-time communication where applicable
- Payment gateway integration

## 📁 Project Structure

```text
HYDERABAD HOUSE/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       └── resources/
│   └── ...
│
├── ai-service/
│   └── ...
│
├── .gitignore
└── README.md
```

## 💳 Payment

Payment processing is handled through the backend payment integration.

Payment status is maintained separately from order status to ensure that an order is not considered successfully paid based only on a frontend action.

## 🔄 Order Status

Typical order progression:

```text
PLACED
   ↓
CONFIRMED
   ↓
PREPARING
   ↓
READY
   ↓
ASSIGNED
   ↓
PICKED_UP
   ↓
OUT_FOR_DELIVERY
   ↓
DELIVERED
```

Pickup and dine-in orders can follow their respective workflows without requiring a delivery staff assignment.

## 🔒 Security

- Authentication required for protected operations
- Role-based authorization
- User-specific order access
- Backend validation
- Sensitive credentials should be stored using environment variables
- Payment credentials should never be committed to GitHub

## 🧪 Development

Clone the repository:

```bash
git clone https://github.com/maruthikumarkm/HYDERABAD-HOUSE.git
```

Enter the project:

```bash
cd HYDERABAD-HOUSE
```

Follow the frontend and backend setup instructions according to the respective project configuration.

## 👨‍💻 Project

**HYDERABAD HOUSE**

Full-stack restaurant ordering, kitchen management, outlet management, delivery management, and administration platform.
