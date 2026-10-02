-- ============================================================
-- SAARA TEST/DUMMY DATA HATAO  (dukaan ko fresh karne ke liye)
-- Supabase SQL Editor me paste karke "Run" dabao.
--
-- ⚠️ YE SAB BUSINESS DATA DELETE KAR DEGA (wapas nahi aayega):
--    products, customers, bills, bill_items, stock_movements, ledger_entries
--
-- ✅ Ye SAFE rehta hai (nahi hatega):
--    - Login (auth users) aur roles (profiles - admin/staff)
--    - Tables ka structure, functions (create_bill/update_bill), views
--
-- Bill number bhi fir se #1 se shuru hoga (RESTART IDENTITY).
--
-- 👉 Ye SIRF tab chalao jab app dukaandaar ko dena ho (fresh).
-- ============================================================

truncate table
  bill_items,
  stock_movements,
  ledger_entries,
  bills,
  products,
  customers
restart identity cascade;

-- Done! ✅  Ab dukaan bilkul khaali (fresh) hai. Pehla bill #1 se banega.
-- (Login aur admin/staff roles waise hi hain.)
