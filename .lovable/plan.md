
## Amira Gold — MVP Plan

This is a massive multi-month platform spec. To ship something real and useful quickly, I'll build a strong **Phase 1 MVP** focused on the public-facing experience + authenticated user dashboard core. Admin tools, KYC, certificates PDF, live chat, ATM card, and proof-of-reserves audit pipelines are scoped for later phases.

### Phase 1 — What gets built now

**Public Landing Site** (separate routes for SEO)
- `/` Home — hero with gold imagery, value prop, dual CTAs (Buy / Invest), live gold price ticker, trust badges, how-it-works, testimonials, CEO section (Amira Aldahab), FAQ
- `/buy` — Gold store: bars in 1g / 5g / 10g / 50g / 100g
- `/invest` — Fractional digital gold pitch + performance chart
- `/proof-of-reserves` — Public reserves summary
- `/about`, `/contact` — standard pages
- Live gold price via public API (e.g. metals.dev / GoldAPI free tier or stub) with auto-refresh

**Auth** (Lovable Cloud)
- Email/password signup + login
- `profiles` table + `user_roles` table (admin / user) with secure `has_role()` function

**User Dashboard** (`/app/*`, protected)
- Overview: portfolio value, gold grams held, wallet balance, performance chart
- Buy Gold flow: select product → quantity → live price → vault vs delivery → confirm (deducts wallet, creates order, updates holdings)
- Invest: buy/sell fractional digital gold at live price
- Holdings: list with vault location
- Orders: history + status
- Wallet: deposit (mock top-up), withdraw, transactions list
- Certificates: simple in-app certificate view per holding (PDF export later)
- Settings

**Admin Dashboard** (`/admin/*`, role-protected)
- Overview KPIs (users, orders, revenue, total gold inventory)
- Gold Products CRUD
- Vaults + inventory allocation
- Orders management
- Users list (suspend/verify flag)

**Database** (Lovable Cloud / Postgres + RLS)
- `profiles`, `user_roles`, `wallets`, `wallet_transactions`
- `gold_products`, `vaults`, `vault_inventory`
- `orders`, `holdings`, `certificates`
- `couriers`, `notifications`
- Seed data: gold products, 2 vaults (Dubai, Zurich), couriers

### Design
- Premium fintech feel: deep charcoal background, gold accent (#D4AF37 family), light neutral surfaces
- Modern sans-serif, soft shadows, rounded corners, smooth transitions
- Fully responsive with collapsible sidebar in dashboards + mobile bottom nav
- Skeleton loaders, hover effects, subtle animations

### Explicitly deferred (Phase 2+)
KYC/AML document upload + verification, AML transaction monitoring, real payment processor (Stripe), real gold price feed contract, PDF certificate generation, live chat with agents, ATM card issuance, courier API integrations, third-party audit/proof-of-reserves cryptographic verification, SSO, 2FA.

After approval I'll enable Lovable Cloud, scaffold the schema with RLS, build the landing site, then auth + dashboards.
