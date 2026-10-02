-- ============================================================
-- Shri Ganesh Traders - Database Schema
-- Supabase SQL Editor me poori file paste karke "Run" dabao.
-- (Building material shop: stock + billing + udhari khata)
-- ============================================================

-- ---------- 1. PRODUCTS (Maal / Stock) ----------
create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,                       -- "Gitti 10mm", "Balu", "Cement OPC 43"
  unit            text not null default 'nag',         -- bag / ton / truck / cft / brass / nag / piece
  rate            numeric(12,2) not null default 0,    -- becne ka rate (per unit)
  stock_qty       numeric(12,2) not null default 0,    -- abhi kitna maal hai
  low_stock_alert numeric(12,2) not null default 0,    -- itne se kam ho to alert
  created_at      timestamptz not null default now()
);

-- ---------- 2. CUSTOMERS (Grahak) ----------
create table if not exists customers (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  phone           text,
  address         text,
  opening_balance numeric(12,2) not null default 0,    -- purani udhari (jo pehle se baaki thi)
  created_at      timestamptz not null default now()
);

-- ---------- 3. BILLS ----------
create table if not exists bills (
  id            uuid primary key default gen_random_uuid(),
  bill_no       bigint generated always as identity,   -- auto badhne wala bill number
  customer_id   uuid references customers(id) on delete set null,
  customer_name text,                                   -- cash grahak ke liye (bina record ke)
  bill_date     date not null default current_date,
  subtotal      numeric(12,2) not null default 0,
  discount      numeric(12,2) not null default 0,
  total_amount  numeric(12,2) not null default 0,
  paid_amount   numeric(12,2) not null default 0,       -- abhi kitna cash/upi mila
  payment_mode  text default 'cash',                    -- cash / upi / udhaar / mixed
  note          text,
  created_at    timestamptz not null default now()
);

-- ---------- 4. BILL ITEMS (bill ke andar ke maal) ----------
create table if not exists bill_items (
  id           uuid primary key default gen_random_uuid(),
  bill_id      uuid not null references bills(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  product_name text not null,                           -- naam save (product delete ho jaye to bhi bill sahi)
  qty          numeric(12,2) not null,
  rate         numeric(12,2) not null,
  amount       numeric(12,2) not null,                  -- qty * rate
  created_at   timestamptz not null default now()
);

-- ---------- 5. STOCK MOVEMENTS (maal aana/jaana ka log) ----------
create table if not exists stock_movements (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  type       text not null,                             -- 'in' (aaya), 'out' (gaya/becha), 'adjust'
  qty        numeric(12,2) not null,
  note       text,
  bill_id    uuid references bills(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- 6. LEDGER (Udhari khata: har customer ka hisaab) ----------
create table if not exists ledger_entries (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  entry_date  date not null default current_date,
  type        text not null,                            -- 'debit' (customer pe chadha), 'credit' (customer ne diya)
  amount      numeric(12,2) not null,
  description text,
  bill_id     uuid references bills(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------- Indexes (fast search) ----------
create index if not exists idx_bills_customer   on bills(customer_id);
create index if not exists idx_bills_date        on bills(bill_date desc);
create index if not exists idx_bill_items_bill   on bill_items(bill_id);
create index if not exists idx_stock_mov_product on stock_movements(product_id, created_at desc);
create index if not exists idx_ledger_customer   on ledger_entries(customer_id, entry_date desc);

-- ============================================================
-- VIEW: har customer ka current balance (kitna udhaar baaki)
-- balance = purani udhari + (sab bill/debit) - (sab payment/credit)
-- ============================================================
create or replace view customer_balances
with (security_invoker = on) as
select
  c.id,
  c.name,
  c.phone,
  c.address,
  c.opening_balance,
  c.created_at,
  c.opening_balance
    + coalesce(sum(case when l.type = 'debit'  then l.amount else 0 end), 0)
    - coalesce(sum(case when l.type = 'credit' then l.amount else 0 end), 0) as balance
from customers c
left join ledger_entries l on l.customer_id = c.id
group by c.id;

-- ============================================================
-- FUNCTION: create_bill
-- Ek saath: bill banao + items daalo + stock kam karo + khata update karo
-- (sab ek transaction me, taaki hisaab kabhi galat na ho)
-- ============================================================
create or replace function create_bill(
  p_customer_id   uuid,
  p_customer_name text,
  p_bill_date     date,
  p_discount      numeric,
  p_paid_amount   numeric,
  p_payment_mode  text,
  p_note          text,
  p_items         jsonb          -- [{product_id, product_name, qty, rate}]
)
returns bills
language plpgsql
security invoker
as $$
declare
  v_bill     bills;
  v_subtotal numeric := 0;
  v_total    numeric := 0;
  v_item     jsonb;
  v_amount   numeric;
begin
  -- subtotal nikalo
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_subtotal := v_subtotal + ((v_item->>'qty')::numeric * (v_item->>'rate')::numeric);
  end loop;

  v_total := v_subtotal - coalesce(p_discount, 0);

  -- bill banao
  insert into bills (customer_id, customer_name, bill_date, subtotal, discount,
                     total_amount, paid_amount, payment_mode, note)
  values (p_customer_id, p_customer_name, coalesce(p_bill_date, current_date),
          v_subtotal, coalesce(p_discount, 0), v_total,
          coalesce(p_paid_amount, 0), coalesce(p_payment_mode, 'cash'), p_note)
  returning * into v_bill;

  -- items daalo + stock kam karo + movement log karo
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_amount := (v_item->>'qty')::numeric * (v_item->>'rate')::numeric;

    insert into bill_items (bill_id, product_id, product_name, qty, rate, amount)
    values (v_bill.id,
            nullif(v_item->>'product_id','')::uuid,
            v_item->>'product_name',
            (v_item->>'qty')::numeric,
            (v_item->>'rate')::numeric,
            v_amount);

    if nullif(v_item->>'product_id','') is not null then
      update products
        set stock_qty = stock_qty - (v_item->>'qty')::numeric
        where id = (v_item->>'product_id')::uuid;

      insert into stock_movements (product_id, type, qty, note, bill_id)
      values ((v_item->>'product_id')::uuid, 'out', (v_item->>'qty')::numeric,
              'Bill #' || v_bill.bill_no, v_bill.id);
    end if;
  end loop;

  -- Udhari khata (sirf jab customer chuna ho)
  if p_customer_id is not null then
    insert into ledger_entries (customer_id, entry_date, type, amount, description, bill_id)
    values (p_customer_id, coalesce(p_bill_date, current_date), 'debit', v_total,
            'Bill #' || v_bill.bill_no, v_bill.id);

    if coalesce(p_paid_amount, 0) > 0 then
      insert into ledger_entries (customer_id, entry_date, type, amount, description, bill_id)
      values (p_customer_id, coalesce(p_bill_date, current_date), 'credit', p_paid_amount,
              'Bill #' || v_bill.bill_no || ' - jama', v_bill.id);
    end if;
  end if;

  return v_bill;
end;
$$;

-- ============================================================
-- FUNCTION: record_stock_movement
-- Maal andar (kharida) ya bahar (adjust) karo + stock update
-- ============================================================
create or replace function record_stock_movement(
  p_product_id uuid,
  p_type       text,      -- 'in' / 'out' / 'adjust'
  p_qty        numeric,
  p_note       text
)
returns void
language plpgsql
security invoker
as $$
begin
  if p_type = 'out' then
    update products set stock_qty = stock_qty - p_qty where id = p_product_id;
  else
    -- 'in' ya 'adjust': qty add karo (adjust me negative bhej sakte ho)
    update products set stock_qty = stock_qty + p_qty where id = p_product_id;
  end if;

  insert into stock_movements (product_id, type, qty, note)
  values (p_product_id, p_type, p_qty, p_note);
end;
$$;

-- ============================================================
-- SECURITY (RLS): sab tables lock karo, sirf logged-in user (dukaan malik)
-- ka access. Bina login koi data nahi dekh/badal sakta.
-- ============================================================
alter table products       enable row level security;
alter table customers      enable row level security;
alter table bills          enable row level security;
alter table bill_items     enable row level security;
alter table stock_movements enable row level security;
alter table ledger_entries enable row level security;

create policy "logged in full access" on products        for all to authenticated using (true) with check (true);
create policy "logged in full access" on customers       for all to authenticated using (true) with check (true);
create policy "logged in full access" on bills           for all to authenticated using (true) with check (true);
create policy "logged in full access" on bill_items      for all to authenticated using (true) with check (true);
create policy "logged in full access" on stock_movements for all to authenticated using (true) with check (true);
create policy "logged in full access" on ledger_entries  for all to authenticated using (true) with check (true);

-- Done! ✅
