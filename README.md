# HYDERABAD HOUSE — Restaurant Direct Ordering Platform

A production-grade, full-stack, direct restaurant ordering web application and real-time Kitchen Display System (KDS) developed for **HYDERABAD HOUSE**, a premium Hyderabadi biryani and authentic cuisine restaurant chain operating **14 dine-in/takeaway outlets** and **3 cloud kitchens** across the Hyderabad metropolitan region.

Designed to eliminate heavy third-party aggregator commissions (Swiggy, Zomato), this platform centralizes customer ordering, AI-powered preparation time forecasting, real-time kitchen dispatch, outlet management, catering/party booking, and administrative analytics.



## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, TypeScript, Tailwind CSS, React Router v6, Axios, Lucide React, Recharts, `@stomp/stompjs`, `sockjs-client`, `canvas-confetti` |
| **Backend** | Java 21 (LTS), Spring Boot 3.3.5, Spring Web, Spring Data JPA, Hibernate, Spring Security 6, JJWT 0.12.5, Spring WebSocket, STOMP Messaging, Bean Validation, Maven |
| **AI / ML** | Python 3.13 / Anaconda, FastAPI, Uvicorn, Scikit-learn (RandomForestRegressor, OneHotEncoder, StandardScaler Pipeline), Pandas, NumPy, Joblib |
| **Database** | MySQL 8.0+ / 9.0+, InnoDB, Foreign Key Constraints, B-Tree Indexes, 20 Relational Tables |

---

## 🔑 Demo User Accounts

All accounts are pre-seeded with the password: **`password123`**

| Role | Email | Password | Assigned Outlet / Access Level |
|---|---|---|---|
| **CUSTOMER** | `customer@hyderabadhouse.com` | `password123` | Direct customer orders, cart, tracking, loyalty points |
| **KITCHEN_STAFF** | `kitchen.kondapur@hyderabadhouse.com` | `password123` | Kondapur Main Kitchen (Real-time KDS tablet view) |
| **OUTLET_MANAGER** | `manager.kondapur@hyderabadhouse.com` | `password123` | Kondapur Outlet (Workload, out-of-stock, prep overrides) |
| **CENTRAL_ADMIN** | `admin@hyderabadhouse.com` | `password123` | Chain-wide overview, menu CRUD, pricing, full analytics |
| **CATERING_MANAGER** | `catering@hyderabadhouse.com` | `password123` | Bulk party requests, quote approvals, guest scheduling |

> Customers can also register independently through the `/register` portal.

---

## 📦 Preserved Test Orders

The database comes pre-seeded with the three required reference orders across different outlets:

1. **`WEB-778120`**
   - **Outlet:** Kondapur (`HYD-OUT-003`)
   - **Customer:** Rajesh Sharma (`+91 98765 43210`)
   - **Items:** 1× Chicken Dum Biryani (Family Pack), 2× Double Ka Meetha
   - **Amount:** ₹1,180.00 (Paid via UPI)
   - **Status:** `PREPARING`
   - **Live Tracking:** Visit `http://localhost:5173/orders/track/WEB-778120`

2. **`WEB-778131`**
   - **Outlet:** Gachibowli Cloud Kitchen (`HYD-CK-001`)
   - **Customer:** Ananya Reddy (`+91 98765 43211`)
   - **Items:** 2× Hyderabadi Veg Dum Biryani, 1× Mirchi Ka Salan
   - **Amount:** ₹640.00 (Paid via Card)
   - **Status:** `READY_FOR_PICKUP`
   - **Live Tracking:** Visit `http://localhost:5173/orders/track/WEB-778131`

3. **`WEB-778146`**
   - **Outlet:** Kukatpally (`HYD-OUT-004`)
   - **Customer:** Vikram Rao (`+91 98765 43212`)
   - **Items:** 3× Shahi Mutton Haleem
   - **Amount:** ₹1,050.00 (Paid via UPI)
   - **Status:** `PREPARING` (Flagged as **Late by 4 minutes**, highlighted in red on KDS & Manager dashboard)
   - **Live Tracking:** Visit `http://localhost:5173/orders/track/WEB-778146`

---

## 🚀 Quick Startup Guide

### 1. Prerequisites
- **Java 21 JDK** (`java -version`)
- **Maven 3.8+** (`mvn -v`)
- **Node.js 18+** & **npm 9+** (`node -v`, `npm -v`)
- **Python 3.10+** with `scikit-learn`, `fastapi`, `uvicorn`, `pandas`, `joblib`
- **MySQL 8.0+** running on `localhost:3306`

---

### 2. Database Initialization
Log into MySQL and execute the schema and seed scripts:

```bash
# Create and populate database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS hyderabad_house CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p hyderabad_house < database/schema.sql
mysql -u root -p hyderabad_house < database/seed.sql
```

---

### 3. Start the AI Preparation Service (FastAPI)
The AI service trains/loads the Scikit-learn `RandomForestRegressor` and listens on port **8000**:

```bash
cd ai-service

# (Optional: Train the model if not already generated)
python3 training/train_model.py

# Launch FastAPI microservice
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- Health Check: `http://localhost:8000/health`
- Swagger Docs: `http://localhost:8000/docs`

---

### 4. Start the Backend (Spring Boot 3)
```bash
cd backend

# Compile & run Spring Boot application on port 8080
mvn spring-boot:run
```
- Backend REST Base URL: `http://localhost:8080/api`
- WebSocket STOMP Endpoint: `http://localhost:8080/ws`

---

### 5. Start the Frontend (React + Vite)
```bash
cd frontend

# Install dependencies (if not done)
npm install

# Run Vite dev server on port 5173
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

---

## 🌟 Key Functional Modules & Business Rules

### 1. Real-Time Kitchen Display System (KDS)
- **URL:** `http://localhost:5173/kitchen` (Sign in as `kitchen.kondapur@hyderabadhouse.com`)
- **4-Stage Kanban:** `NEW ORDERS` → `PREPARING` → `READY` → `HANDED OFF`
- **Immediate Push:** When a customer places an order, Spring WebSocket publishes to `/topic/kitchen/{outletId}`. The order card renders instantly on the tablet screen without browser refresh.
- **Audio & Visual Alerts:** New orders trigger chime sounds and pulse animations.
- **Dynamic Urgency Timers:** Countdown timer with visual color progression:
  - Blue: In preparation (< 75% elapsed)
  - Yellow: Approaching promised time (> 75% elapsed)
  - Red / Flashing: Overdue / Late
- **Recovery:** Automatically fetches active orders via REST on page load and reconnects SockJS on network drop.

### 2. AI-Powered Preparation Time Prediction
- Multi-factor Scikit-learn regression pipeline trained on kitchen history:
  - Inputs: Item categories, total items, total quantity, target outlet, active pending orders in kitchen.
  - Test MAE: 2.66 minutes ($R^2 = 0.75$).
- **Business Rule Enforced:** 
  $$\text{Promised Prep Time} = \max(\text{AI Predicted Duration}, \text{Outlet Minimum Prep Time})$$
- **Graceful Fallback:** If the AI service is unreachable, Spring Boot immediately employs an algorithmic heuristic (`base_prep + item_count * 2.5 + active_orders * 1.8`) ensuring checkout never fails.

### 3. Geolocation & Haversine Nearest Outlet Routing
- Automatic outlet calculation using Haversine spherical trigonometry:
  $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1\cos\phi_2\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- Checks customer location against 17 Hyderabad locations (14 outlets + 3 cloud kitchens).
- Prevents delivery outside active outlet radii (5 km to 12 km depending on outlet tier).

### 4. Indian Tax, Pricing & DPDP Compliance
- **5% Food & Beverage GST:** Clearly displayed on food cards as included in the price. Itemized mathematically at checkout:
  $$\text{Tax Amount} = \text{Subtotal} \times \frac{5}{105}$$
- **Digital Personal Data Protection (DPDP) Act 2023:** Marketing checkboxes (SMS, Email, WhatsApp promotions) in checkout and registration are strictly unbundled, explicitly optional, and saved to `customer_marketing_preferences`. Checkout is never gated on consent.

### 5. Out-of-Stock & Price Overrides
- Outlet managers can toggle real-time availability of any dish for their specific outlet.
- Disabling an item instantly invalidates it on that outlet's customer menu and aborts any duplicate cart submission on the backend with a 400 Bad Request.

### 6. Party & Bulk Catering Orders
- Minimum advance notice (24 hours) and minimum guest thresholds (20 guests) enforced in both frontend validation and backend service.
- Catering managers can review, approve, reject, and add pricing quotes.

### 7. Executive Analytics Dashboard
- Dynamic SQL aggregations across live database records:
  - Total chain-wide revenue & order volume
  - Outlet performance comparison bar charts
  - Category sales breakdown pie charts
  - Daily sales trends with area charts
  - Average preparation time tracking per outlet

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user and issue JWT | Public |
| `POST` | `/api/auth/register` | Register new customer account | Public |
| `GET` | `/api/outlets` | Fetch all 17 active outlets & cloud kitchens | Public |
| `GET` | `/api/outlets/nearest` | Find nearest outlet by `(lat, lng)` query | Public |
| `GET` | `/api/menu/categories` | Fetch active menu categories | Public |
| `GET` | `/api/menu/items` | Fetch all menu items or filter by `?outletId=` | Public |
| `POST` | `/api/coupons/validate` | Validate coupon code against subtotal | Public |
| `POST` | `/api/orders/create` | Submit customer order (validates stock & calculates tax) | Optional/User |
| `GET` | `/api/orders/{orderNumber}` | Live order tracking details | Public |
| `GET` | `/api/kitchen/orders` | Fetch active KDS orders for staff's outlet | `KITCHEN_STAFF` |
| `PATCH` | `/api/kitchen/orders/{id}/status` | Advance KDS order status (`PREPARING`, `READY`, etc.) | `KITCHEN_STAFF` |
| `GET` | `/api/outlet-manager/workload` | Real-time kitchen workload & late orders | `OUTLET_MANAGER` |
| `PATCH` | `/api/outlet-manager/inventory/{id}` | Toggle item availability for outlet | `OUTLET_MANAGER` |
| `GET` | `/api/admin/analytics` | Chain-wide sales, category, and outlet analytics | `CENTRAL_ADMIN` |
| `POST` | `/api/admin/menu/items` | Create new menu item | `CENTRAL_ADMIN` |
| `GET` | `/api/party-orders` | Fetch party order requests | `CATERING_MANAGER` |
| `PATCH` | `/api/party-orders/{id}/status` | Approve / Reject party order | `CATERING_MANAGER` |
| `POST` | `http://localhost:8000/predict-prep-time` | FastAPI AI prep time regression endpoint | Internal |

---

## 🛡️ License & Trademarks
Developed for **HYDERABAD HOUSE Restaurant Chain**. All rights reserved.
