# Supabase setup

1. In Supabase, open **SQL Editor**, paste and run [`schema.sql`](./schema.sql).
2. This app uses the Supabase anon role without a login. The schema grants that role access to store data, so only use it for a private/personal project.
3. Copy `.env.example` to `.env.local` and fill in the project's URL and anon/publishable key. Never put a `service_role` key in a browser app.
4. Restart the Vite development server after changing environment variables.

Products, image files, transactions, and transaction items are stored in Supabase. Products can be edited and deleted from **Barang & Stok**. Checkout calls `complete_sale`, which records the sale and decreases stock in one database transaction. Product photos use the public `product-images` bucket; do not upload private images there.

After enabling product edit/delete, run the updated [`schema.sql`](./schema.sql) in the Supabase SQL Editor so the anon role has the required update/delete permissions and image cleanup policy.

The anon key is public in a browser app. With login disabled, anyone who can reach the app or its Supabase project can read or change store data. Do not deploy this configuration to a public website; use authentication and authenticated-only policies for public deployments.

If Supabase is not configured, the app runs in a temporary in-memory demo mode. Demo changes are lost on refresh.
