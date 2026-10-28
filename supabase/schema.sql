create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  purchase_price bigint check (purchase_price >= 0),
  price bigint not null check (price > 0),
  unit text not null default 'Satuan',
  stock integer not null default 0 check (stock >= 0),
  image text,
  description text not null default '',
  barcode text unique,
  barcode_image text,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_number text not null unique,
  cashier_id uuid not null references auth.users(id),
  payment_method text not null,
  subtotal bigint not null check (subtotal >= 0),
  discount_type text not null check (discount_type in ('percent', 'amount')),
  discount_value bigint not null default 0 check (discount_value >= 0),
  discount_amount bigint not null default 0 check (discount_amount >= 0),
  tax_amount bigint not null default 0 check (tax_amount >= 0),
  total_amount bigint not null check (total_amount >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.transaction_items (
  id bigint generated always as identity primary key,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price bigint not null check (unit_price >= 0),
  purchase_price bigint check (purchase_price >= 0),
  line_total bigint not null check (line_total >= 0),
  line_profit bigint
);

create index if not exists transactions_created_at_idx on public.transactions (created_at desc);
create index if not exists transaction_items_transaction_id_idx on public.transaction_items (transaction_id);

alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;

drop policy if exists "Authenticated users can read products" on public.products;
create policy "Authenticated users can read products"
  on public.products for select to authenticated using (true);

drop policy if exists "Authenticated users can add products" on public.products;
create policy "Authenticated users can add products"
  on public.products for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update products" on public.products;
create policy "Authenticated users can update products"
  on public.products for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can read transactions" on public.transactions;
create policy "Authenticated users can read transactions"
  on public.transactions for select to authenticated using (true);

drop policy if exists "Authenticated users can read transaction items" on public.transaction_items;
create policy "Authenticated users can read transaction items"
  on public.transaction_items for select to authenticated using (true);

grant select, insert, update on public.products to authenticated;
grant select on public.transactions, public.transaction_items to authenticated;
grant usage, select on sequence public.transaction_items_id_seq to authenticated;
revoke all on public.products, public.transactions, public.transaction_items from anon;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select to public using (bucket_id = 'product-images');

drop policy if exists "Authenticated users can upload product images" on storage.objects;
create policy "Authenticated users can upload product images"
  on storage.objects for insert to authenticated with check (bucket_id = 'product-images');

drop policy if exists "Authenticated users can update product images" on storage.objects;
create policy "Authenticated users can update product images"
  on storage.objects for update to authenticated using (bucket_id = 'product-images') with check (bucket_id = 'product-images');

create or replace function public.complete_sale(
  p_transaction_number text,
  p_payment_method text,
  p_discount_type text,
  p_discount_value bigint,
  p_tax_enabled boolean,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cashier_id uuid := auth.uid();
  v_transaction_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_subtotal bigint := 0;
  v_discount_amount bigint := 0;
  v_tax_amount bigint := 0;
  v_total bigint := 0;
begin
  if v_cashier_id is null then
    raise exception 'Login kasir diperlukan untuk menyimpan transaksi.';
  end if;
  if p_payment_method not in ('Tunai', 'QRIS', 'Debit') then
    raise exception 'Metode pembayaran tidak valid.';
  end if;
  if p_discount_type not in ('percent', 'amount') or p_discount_value < 0 then
    raise exception 'Diskon tidak valid.';
  end if;
  if coalesce(jsonb_typeof(p_items), '') <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang transaksi kosong.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity <= 0 then
      raise exception 'Jumlah barang tidak valid.';
    end if;

    select * into v_product
    from public.products
    where id = v_item ->> 'product_id'
    for update;

    if not found then
      raise exception 'Produk % tidak ditemukan.', v_item ->> 'product_id';
    end if;
    if v_product.stock < v_quantity then
      raise exception 'Stok % tidak mencukupi. Stok tersedia: %.', v_product.name, v_product.stock;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  if p_discount_type = 'percent' then
    v_discount_amount := least(v_subtotal, round(v_subtotal * least(p_discount_value, 100)::numeric / 100)::bigint);
  else
    v_discount_amount := least(v_subtotal, p_discount_value);
  end if;
  if p_tax_enabled then
    v_tax_amount := round((v_subtotal - v_discount_amount) * 0.11)::bigint;
  end if;
  v_total := v_subtotal - v_discount_amount + v_tax_amount;

  insert into public.transactions (
    transaction_number, cashier_id, payment_method, subtotal,
    discount_type, discount_value, discount_amount, tax_amount, total_amount
  )
  values (
    p_transaction_number, v_cashier_id, p_payment_method, v_subtotal,
    p_discount_type, p_discount_value, v_discount_amount, v_tax_amount, v_total
  )
  returning id into v_transaction_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    select * into v_product
    from public.products
    where id = v_item ->> 'product_id'
    for update;

    update public.products set stock = stock - v_quantity where id = v_product.id;

    insert into public.transaction_items (
      transaction_id, product_id, product_name, quantity,
      unit_price, purchase_price, line_total, line_profit
    )
    values (
      v_transaction_id, v_product.id, v_product.name, v_quantity,
      v_product.price, v_product.purchase_price,
      v_product.price * v_quantity,
      case
        when v_product.purchase_price is null then null
        else (v_product.price - v_product.purchase_price) * v_quantity
      end
    );
  end loop;

  return v_transaction_id;
end;
$$;

revoke all on function public.complete_sale(text, text, text, bigint, boolean, jsonb) from public, anon;
grant execute on function public.complete_sale(text, text, text, bigint, boolean, jsonb) to authenticated;

insert into public.products (id, name, category, price, purchase_price, stock, unit, image)
values
  ('BRG-051', 'Mie Goreng Telur', 'Makanan', 12000, null, 120, 'Satuan', 'photo-1569718212165-3a8278d5f624'),
  ('BRG-052', 'Mie Goreng Telur + Sosis + Bakso', 'Makanan', 18000, null, 33, 'Satuan', 'photo-1565299624946-b28f40a0ae38'),
  ('BRG-053', 'Roti Bakar Madu Rasa', 'Makanan', 15000, null, 32, 'Satuan', 'photo-1525351484163-7529414344d8'),
  ('BRG-054', 'Martabak Manis Coklat', 'Makanan', 15000, null, 3, 'Satuan', 'photo-1601050690597-df0568f70950'),
  ('BRG-001', 'Air Mineral 600ml', 'Minuman', 5000, null, 120, 'Satuan', 'photo-1602143407151-7111542de6e8'),
  ('BRG-002', 'Es Teh Jumbo', 'Minuman', 8000, null, 81, 'Satuan', 'photo-1556679343-c7306c1976bc'),
  ('BRG-003', 'Ocha 500ml', 'Minuman', 8000, null, 32, 'Satuan', 'photo-1559839914-17aae19cec71')
on conflict (id) do nothing;
