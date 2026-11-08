# Hyderabad House — Deployment Guide

## 1. Project Overview

Hyderabad House is a full-stack restaurant ordering platform with:

- React + Vite frontend
- Spring Boot backend
- MySQL database
- Python FastAPI AI service
- Role-based authentication
- Customer ordering and cart
- Kitchen Display System
- Outlet Manager operations
- Central Admin dashboard
- Delivery Staff workflow
- Party/Bulk ordering
- Payment integration

## 2. Prerequisites

Install:

- Node.js 18+ and npm
- Java 17+
- Maven
- MySQL 8+
- Python 3.10+
- Git

Verify:

```bash
node -v
npm -v
java -version
mvn -version
python3 --version
mysql --version
```

## 3. Repository Setup

Clone the GitHub repository:

```bash
git clone https://github.com/maruthikumarkm/HYDERABAD-HOUSE
cd HYDERABAD-HOUSE
```

## 4. Database Setup

Create the MySQL database:

```sql
CREATE DATABASE hyderabad_house;
```

Configure the backend database connection with environment variables or the application's configuration.

Example:

```text
DB_URL=jdbc:mysql://localhost:3306/hyderabad_house
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

Do not commit database passwords or other secrets.

## 5. Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

## 6. Frontend Setup

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Configure the frontend API URL as required. Example:

```text
VITE_API_BASE_URL=http://localhost:8080
```

## 7. AI Service Setup

In another terminal, move into the AI service directory:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Start the FastAPI service using the command defined by the project. Example:

```bash
uvicorn main:app --reload
```

## 8. Environment Variables and Secrets

Production secrets must be stored in the hosting platform's environment-variable configuration.

Do not commit:

- Database passwords
- API keys
- Payment gateway secrets
- JWT secrets
- Private credentials

Use local `.env` files where appropriate and add them to `.gitignore`.

Keep an `.env.example` file containing variable names without real secret values.

## 9. Payment Configuration

Payment credentials must be configured only on the backend/server environment.

Use the payment provider's supported sandbox or production configuration according to the deployment environment.

Never put secret payment credentials in frontend source code.

## 10. Production Deployment

Deploy the three major services according to the hosting platforms selected for the project:

1. Frontend
2. Spring Boot backend
3. Python AI service

Configure production environment variables for each service.

Update the frontend API URL to point to the deployed backend.

Update backend configuration to use the production database and required external services.

## 11. CORS and API Configuration

Configure backend CORS to allow requests from the deployed frontend domain.

Verify:

- Login and registration
- Menu loading
- Cart
- Order placement
- Kitchen updates
- Outlet Manager updates
- Delivery Staff updates
- Live tracking
- Payment callbacks/status verification

## 12. Production Verification

Verify the complete workflow:

Customer → Cart → Checkout → Payment → Database Order → Kitchen Staff → Outlet Manager → Delivery Staff → Out for Delivery → Delivered → Customer Live Tracking

Also verify that orders remain available after logout and login.

## 13. Security Checklist

Before deployment:

- Remove test credentials.
- Remove hardcoded passwords.
- Remove API keys from source code.
- Confirm `.env` files are ignored by Git.
- Confirm database credentials are not committed.
- Confirm backend authorization protects APIs.
- Confirm role-based access works correctly.
- Confirm payment secrets exist only on the server.

## 14. Deployment URLs

After deployment, record the public URLs:

```text
Frontend URL: <YOUR_DEPLOYED_FRONTEND_URL>
Backend URL: <YOUR_DEPLOYED_BACKEND_URL>
AI Service URL: <YOUR_DEPLOYED_AI_SERVICE_URL>
```

If a service is not publicly exposed, document how the other deployed services access it.

## 15. Troubleshooting

### Frontend cannot connect to backend

Check:

- `VITE_API_BASE_URL`
- Backend URL
- CORS configuration
- Backend service status

### Backend cannot connect to MySQL

Check:

- Database URL
- Database username
- Database password
- Database availability
- Database port

### AI service is unavailable

Check:

- Python environment
- Installed dependencies
- AI service environment variables
- Service URL
- Backend connectivity

### Payment does not complete

Check:

- Payment credentials
- Backend payment configuration
- Callback/webhook configuration
- Payment provider dashboard
- Server logs

## 16. Important Note

This document describes the deployment and configuration process. Production URLs, credentials, API keys, and passwords must be supplied through secure environment variables and must not be committed to the GitHub repository.
