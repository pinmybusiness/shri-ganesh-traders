-- ============================================================
-- FUNCTION: update_bill  (BILL EDIT ke liye)
-- Supabase SQL Editor me poori file paste karke "Run" dabao.
--
-- Ye kya karta hai (sab ek transaction me, taaki hisaab galat na ho):
--   1. Purane bill ka stock WAPAS karta hai (jo maal nikla tha, lauta do)
--   2. Purane bill ke items / stock-movement / khata-entry delete karta hai
--   3. Naye items dalta hai, stock kam karta hai, movement log karta hai
--   4. Khata (udhaar) dobara sahi se chadhata hai
-- Bill number same rehta hai.
-- ============================================================
create or replace function update_bill(
  p_bill_id       uuid,
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
  v_old      record;
  v_item     jsonb;
  v_subtotal numeric := 0;
  v_total    numeric;
  v_amount   numeric;
begin
  -- 0. Pakka karo ye bill exist karta hai
  select * into v_bill from bills where id = p_bill_id;
  if not found then
    raise exception 'Bill nahi mila';
  end if;

  -- 1. Purana stock wapas (jo items the unka maal lauta do)
  for v_old in
    select product_id, qty from bill_items
    where bill_id = p_bill_id and product_id is not null
  loop
    update products set stock_qty = stock_qty + v_old.qty where id = v_old.product_id;
  end loop;

  -- 2. Purane records hatao (is bill ke)
  delete from bill_items     where bill_id = p_bill_id;
  delete from stock_movements where bill_id = p_bill_id;
  delete from ledger_entries where bill_id = p_bill_id;

  -- 3. Naya subtotal
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_subtotal := v_subtotal + ((v_item->>'qty')::numeric * (v_item->>'rate')::numeric);
  end loop;
  v_total := v_subtotal - coalesce(p_discount, 0);

  -- 4. Bill row update
  update bills set
    customer_id   = p_customer_id,
    customer_name = p_customer_name,
    bill_date     = coalesce(p_bill_date, current_date),
    subtotal      = v_subtotal,
    discount      = coalesce(p_discount, 0),
    total_amount  = v_total,
    paid_amount   = coalesce(p_paid_amount, 0),
    payment_mode  = coalesce(p_payment_mode, 'cash'),
    note          = p_note
  where id = p_bill_id
  returning * into v_bill;

  -- 5. Naye items + stock kam + movement log
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_amount := (v_item->>'qty')::numeric * (v_item->>'rate')::numeric;

    insert into bill_items (bill_id, product_id, product_name, qty, rate, amount)
    values (p_bill_id,
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
              'Bill #' || v_bill.bill_no || ' (edit)', v_bill.id);
    end if;
  end loop;

  -- 6. Khata (udhaar) dobara - sirf jab customer chuna ho
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

-- Done! ✅  Ab app se bill edit kaam karega.
