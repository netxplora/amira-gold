# Admin and Implementation Guide

This guide covers the technical management, hosting, and implementation details of the Amira Gold platform.

## 1. Administrative Operations

The Admin Dashboard is accessible to users with the `admin` or `agent` role.

### Inventory Management
*   **Categories**: Manage jewelry types and their display order.
*   **Products**: Add new items, set weights, purities, and making charges (fixed or percentage).
*   **Pricing**: Prices are automatically calculated based on the live gold rate fetched via external APIs.

### Order Processing
*   **Review**: Monitor incoming jewelry orders and verify proof-of-payment for digital currency transactions.
*   **fulfillment**: Update order status from 'Pending' to 'Processing', 'Shipped', or 'Delivered'.
*   **Invoicing**: System automatically generates invoices for all successful transactions.

### User Management & KYC
*   **Verification**: Review uploaded KYC documents and approve/reject user verification status.
*   **Roles**: Assign `admin`, `agent`, or `user` roles to manage platform access levels.

### Support & Communication
*   **Ticket System**: Respond to user inquiries and track resolution progress.
*   **Messaging**: Send announcements or direct messages to users regarding their orders or account status.

## 2. Hosting & Infrastructure

### Frontend Hosting
The application is built with Vite and React. It is recommended to host on **Vercel** or **Netlify**:
1. Connect your repository to the hosting provider.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Configure environment variables (Supabase URL and Anon Key).

### Backend & Database
The platform uses **Supabase** for its backend infrastructure:
*   **PostgreSQL**: Handles all relational data with Row Level Security (RLS) enabled.
*   **Authentication**: Managed via Supabase Auth (GoTrue).
*   **Storage**: Buckets are configured for `kyc-documents`, `product-images`, `invoices`, and `avatars`.
*   **Edge Functions**: Custom business logic (e.g., payment verification, email notifications) is handled by Supabase Edge Functions.

## 3. Technical Implementation

### Core Technology Stack
*   **Framework**: React (Vite)
*   **Routing**: TanStack Router
*   **Styling**: Vanilla CSS with Tailwind CSS (as requested)
*   **Database**: PostgreSQL (Supabase)
*   **State Management**: React Query (TanStack Query)

### Security Patterns
*   **Row Level Security (RLS)**: Strictly enforced on all tables. Users can only access their own data, while admins have broader access via specialized policies.
*   **RPC Layer**: Sensitive operations (e.g., placing orders, updating balances) are handled via database functions (RPCs) to ensure atomicity and security.
*   **Validation**: Zod is used for frontend and backend schema validation.

### Health Monitoring
The platform includes an internal health monitor (`src/lib/infrastructure/health-verification.ts`) that verifies:
*   Availability of critical database functions (RPCs).
*   Storage bucket access and configuration.
*   System integrity and connectivity.

## 4. Deployment Checklist

Before moving to production, ensure the following steps are completed:

1.  **Supabase Environment**:
    *   Enable Point-in-Time Recovery (PITR) for the database.
    *   Set up custom SMTP for authentication emails.
    *   Review all RLS policies to ensure no data leaks.
2.  **Frontend Configuration**:
    *   Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in production.
    *   Configure `robots.txt` and `sitemap.xml` for SEO.
    *   Enable analytics (e.g., Google Analytics or Vercel Analytics).
3.  **Storage**:
    *   Verify that all buckets have the correct public/private access settings.
    *   Ensure file size limits and allowed MIME types are configured.
4.  **Testing**:
    *   Run a full end-to-end checkout flow using a test account.
    *   Verify that invoices are generated and emailed correctly.

## 5. Database Schema Overview

The core of the platform is driven by the following table groups:

*   **Identity**: `profiles`, `user_roles` (Extends Supabase Auth).
*   **Commerce**: `jewelry_categories`, `jewelry_products`, `orders`, `order_items`.
*   **Finance**: `user_wallets`, `wallet_transactions`, `vault_reserves`.
*   **Support**: `support_tickets`, `support_messages`.
*   **System**: `site_settings`, `gold_price_history`.
