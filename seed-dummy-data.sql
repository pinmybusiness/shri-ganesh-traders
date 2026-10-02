-- ============================================================
-- Shri Ganesh Traders - DUMMY DATA (test ke liye)
-- Supabase SQL Editor me paste karke "Run" dabao.
-- NOTE: Ye sirf EK BAAR run karna (warna data duplicate ho jayega).
-- Sab test data hai - baad me delete kar sakta hai.
-- ============================================================

do $$
declare
  -- product ids
  p_gitti10   uuid;
  p_gitti20   uuid;
  p_balu      uuid;
  p_cement43  uuid;
  p_cementppc uuid;
  p_sariya    uuid;
  p_paint     uuid;
  p_karkat    uuid;
  -- customer ids
  c_ramesh uuid;
  c_suresh uuid;
  c_anil   uuid;
  c_mohan  uuid;
begin
  -- ---------- MAAL (products) ----------
  insert into products (name, unit, rate, stock_qty, low_stock_alert)
    values ('Gitti 10mm', 'ton', 1200, 80, 20) returning id into p_gitti10;
  insert into products (name, unit, rate, stock_qty, low_stock_alert)
    values ('Gitti 20mm', 'ton', 1150, 60, 20) returning id into p_gitti20;
  insert into products (name, unit, rate, stock_qty, low_stock_alert)
    values ('Balu (Sand)', 'ton', 900, 100, 30) returning id into p_balu;
  insert into products (name, unit, rate, stock_qty, low_stock_alert)
    values ('Cement OPC 43', 'bag', 380, 200, 50) returning id into p_cement43;
  insert into products (name, unit, rate, stock_qty, low_stock_alert)
    values ('Cement PPC', 'bag', 360, 15, 50) returning id into p_cementppc;  -- stock kam hai (alert dikhega)
  insert into products (name, unit, rate, stock_qty, low_stock_alert)
    values ('Sariya 8mm', 'kg', 68, 500, 100) returning id into p_sariya;
  insert into products (name, unit, rate, stock_qty, low_stock_alert)
    values ('Asian Paint White', 'litre', 220, 40, 10) returning id into p_paint;
  insert into products (name, unit, rate, stock_qty, low_stock_alert)
    values ('Karkat Sheet 10ft', 'sheet', 650, 25, 10) returning id into p_karkat;

  -- ---------- GRAHAK (customers) ----------
  insert into customers (name, phone, address, opening_balance)
    values ('Ramesh Kumar', '9876543210', 'Rampur', 5000) returning id into c_ramesh;
  insert into customers (name, phone, address, opening_balance)
    values ('Suresh Yadav', '9812345678', 'Bhelupur', 0) returning id into c_suresh;
  insert into customers (name, phone, address, opening_balance)
    values ('Anil Construction', '9900011122', 'Sigra', 12000) returning id into c_anil;
  insert into customers (name, phone, address, opening_balance)
    values ('Mohan Lal', '9871122334', 'Lanka', 0) returning id into c_mohan;

  -- ---------- BILLS (create_bill se - stock aur khata apne aap update honge) ----------

  -- Bill 1: Ramesh, aaj, part payment (mixed)
  perform create_bill(
    c_ramesh, null, current_date, 0, 5000, 'mixed', 'Gaadi UP65 AB 1234',
    jsonb_build_array(
      jsonb_build_object('product_id', p_gitti10,  'product_name', 'Gitti 10mm',    'qty', 5,  'rate', 1200),
      jsonb_build_object('product_id', p_cement43, 'product_name', 'Cement OPC 43', 'qty', 10, 'rate', 380)
    )
  );

  -- Bill 2: Anil Construction, 2 din pehle, poora udhaar (paid 0)
  perform create_bill(
    c_anil, null, current_date - 2, 0, 0, 'udhaar', 'Site delivery',
    jsonb_build_array(
      jsonb_build_object('product_id', p_balu, 'product_name', 'Balu (Sand)', 'qty', 20, 'rate', 900)
    )
  );

  -- Bill 3: Cash Grahak (khata nahi), aaj, poora cash
  perform create_bill(
    null, 'Cash Grahak', current_date, 0, 1090, 'cash', null,
    jsonb_build_array(
      jsonb_build_object('product_id', p_paint,  'product_name', 'Asian Paint White', 'qty', 2, 'rate', 220),
      jsonb_build_object('product_id', p_karkat, 'product_name', 'Karkat Sheet 10ft', 'qty', 1, 'rate', 650)
    )
  );

  -- Bill 4: Suresh, kal, poora paid (khate me chadha bhi + jama bhi = net 0)
  perform create_bill(
    c_suresh, null, current_date - 1, 0, 6800, 'cash', null,
    jsonb_build_array(
      jsonb_build_object('product_id', p_sariya, 'product_name', 'Sariya 8mm', 'qty', 100, 'rate', 68)
    )
  );

  -- Mohan Lal ne purana udhaar thoda jama kiya (sirf payment entry)
  insert into ledger_entries (customer_id, entry_date, type, amount, description)
    values (c_mohan, current_date - 3, 'debit', 8000, 'Purana maal udhaar');
  insert into ledger_entries (customer_id, entry_date, type, amount, description)
    values (c_mohan, current_date - 1, 'credit', 3000, 'Cash jama');

end $$;

-- Done! ✅  Ab app me data dikhega.
