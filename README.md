# WedPlan Server — Backend REST API for Wedding Planning Platform

WedPlan is a modern, high-performance wedding planning platform connecting couples with verified wedding service vendors across various categories. This repository houses the complete backend REST API built with Node.js, Express, TypeScript, MongoDB, JWT authentication, and Stripe payment gateway.

---

## 🌟 Important Features

- **Role-Based Access Control (RBAC)**: Secure server-side authorization separating `Customer`, `Vendor`, and `Admin` permissions.
- **JWT Authentication & Security**: Complete token-based authentication with bcrypt hashing, password complexity validation, and account blocking guards.
- **Service Management & Moderation**:
  - Vendors can create, update, delete, and toggle availability of wedding services.
  - **Free Tier Limiter**: Free tier vendors are strictly limited to a maximum of 3 services.
  - **Admin Moderation**: Services must be reviewed and approved by administrators before going live.
- **Booking Requests Workflow**:
  - Customers can request bookings with date and venue location.
  - Duplicate booking prevention for the same service and date.
  - Vendors can accept or reject pending booking requests (immutable once finalized).
  - Customers can cancel their own pending booking requests.
- **Stripe Checkout & Automated Webhook Fulfillment**:
  - Vendors can upgrade to Premium to publish unlimited wedding services.
  - Automated Stripe webhook verification (`checkout.session.completed`) with raw body parser.
  - Fallback session verification for local development and live testing without tunnels.
- **Admin Dashboard APIs**:
  - Platform-wide statistics (users, vendors, customers, services, pending moderation, transactions, revenue).
  - Searchable user management with instant account blocking/unblocking.
  - Read-only financial transaction records.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **Payments**: Stripe API SDK & Webhooks
- **Validation**: Zod & custom schema guards

---

## 📋 Environment Variables Guide

Create a `.env` file in the root of the server directory based on `.env.example`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/wedplan?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_here
BETTER_AUTH_SECRET=your_better_auth_secret_key_here
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
ADMIN_NAME="Saidul Islam"
ADMIN_EMAIL=saidulhimuu@gmail.com
ADMIN_PASSWORD=Himel12345
```

---

## 🚀 Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Saidulhimu/WedPlan-Server.git
   cd WedPlan-Server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file and fill in your MongoDB URI and Stripe keys.

4. **Seed Database (Admin & Demo Data)**:
   ```bash
   npm run seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

6. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🔗 Repository & Live Links

- **Server Repository**: [https://github.com/Saidulhimu/WedPlan-Server](https://github.com/Saidulhimu/WedPlan-Server)
- **Client Repository**: [https://github.com/Saidulhimu/WedPlan-Client](https://github.com/Saidulhimu/WedPlan-Client)
- **Live Server API**: [https://wed-plan-server-omega.vercel.app](https://wed-plan-server-omega.vercel.app)
- **Live Client Web App**: [https://wed-plan-client-omega.vercel.app](https://wed-plan-client-omega.vercel.app)

---

## 🔐 Demo Credentials for Evaluation

- **Admin Account**:
  - Email: `saidulhimuu@gmail.com`
  - Password: `Himel12345`
- **Vendor Account**:
  - Email: `saidulislam5595@gmail.com`
  - Password: `saidul12345`
- **Customer Account**:
  - Email: `hmcreationn@gmail.com`
  - Password: `hm123456`
