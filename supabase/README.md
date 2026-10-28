# Supabase setup

1. In Supabase, open **SQL Editor**, paste and run [`schema.sql`](./schema.sql).
2. Create a cashier account in **Authentication → Users**. Public sign-up is intentionally not exposed by this app.
3. Copy `.env.example` to `.env.local` and fill in the project's URL and anon/publishable key. Never put a `service_role` key in a browser app.
4. Restart the Vite development server after changing environment variables.

Products, image files, transactions, and transaction items are stored in Supabase. Checkout calls `complete_sale`, which records the sale and decreases stock in one database transaction. Row-level security restricts operational data to authenticated users. Product photos use the public `product-images` bucket; do not upload private images there.

If Supabase is not configured, the app runs in a temporary in-memory demo mode. Demo changes are lost on refresh.
