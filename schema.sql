-- Nano Brewery ERP V2 Schema
-- Database: PostgreSQL (Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Base Auth & Roles)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. SETTINGS (Global Configuration per Owner)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  brewery_name TEXT NOT NULL DEFAULT 'My Nano Brewery',
  alert_days_default INTEGER DEFAULT 30,
  packaging_losses_consume_items BOOLEAN DEFAULT TRUE,
  block_expired_sales BOOLEAN DEFAULT TRUE,
  block_expired_consumption BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_owner_settings UNIQUE (owner_id)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access settings" ON settings FOR ALL USING (auth.uid() = owner_id);

-- 3. LOCATIONS (Inventory Locations)
CREATE TABLE inventory_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('warehouse', 'cold_storage', 'production', 'other')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access locations" ON inventory_locations FOR ALL USING (auth.uid() = owner_id);

-- 4. SUPPLIERS & CUSTOMERS
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('supplier', 'customer')),
  email TEXT,
  phone TEXT,
  tax_id TEXT, -- CNPJ/CPF
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access entities" ON entities FOR ALL USING (auth.uid() = owner_id);

-- 5. ITEMS (Unified: Ingredient, Packaging, Product)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ingredient', 'packaging', 'product')),
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'g', 'L', 'un', 'ml')),
  
  -- Category Subtypes
  ingredient_category TEXT CHECK (ingredient_category IN ('malt', 'hops', 'yeast', 'adjunct', 'chemical', 'other')),
  packaging_category TEXT CHECK (packaging_category IN ('can_body', 'can_lid', 'label', 'box', 'other')),
  
  -- Product Specifics
  volume_ml INTEGER CHECK (type != 'product' OR volume_ml = 473), -- STRICT 473ml for products
  
  sku TEXT,
  barcode TEXT,
  description TEXT,
  
  -- Inventory thresholds
  min_stock_level NUMERIC DEFAULT 0,
  target_stock_level NUMERIC DEFAULT 0,
  lead_time_days INTEGER DEFAULT 0,
  preferred_supplier_id UUID REFERENCES entities(id), -- Only meaningful for ingredients/packaging
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access items" ON items FOR ALL USING (auth.uid() = owner_id);

-- 6. STOCK LOTS (Ingredients & Packaging - Lot Aware)
CREATE TABLE stock_lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  item_id UUID NOT NULL REFERENCES items(id),
  supplier_id UUID REFERENCES entities(id), -- Optional specifically if internal adjustment, but mandatory for purchase
  supplier_lot_code TEXT, -- Traceability!
  location_id UUID REFERENCES inventory_locations(id),
  
  qty_received NUMERIC NOT NULL CHECK (qty_received >= 0),
  qty_on_hand NUMERIC NOT NULL CHECK (qty_on_hand >= 0),
  unit_cost NUMERIC NOT NULL DEFAULT 0, -- Cost basis for this specific lot
  
  received_at TIMESTAMPTZ DEFAULT NOW(),
  expiry_date DATE, -- Mandatory for Yeast via APP LOGIC (DB constraint can be tricky if not strict for all types, but let's try)
  
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'expired', 'quarantine')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access stock_lots" ON stock_lots FOR ALL USING (auth.uid() = owner_id);

-- Index for FEFO
CREATE INDEX idx_stock_lots_fefo ON stock_lots (item_id, expiry_date ASC, received_at ASC) WHERE qty_on_hand > 0;

-- 7. PURCHASE RECEIPTS
CREATE TABLE purchase_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  supplier_id UUID NOT NULL REFERENCES entities(id),
  invoice_number TEXT,
  total_amount NUMERIC DEFAULT 0,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'completed', -- draft, completed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchase_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access receipts" ON purchase_receipts FOR ALL USING (auth.uid() = owner_id);

-- 8. TANKS / VESSELS
CREATE TABLE vessels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mash_tun', 'kettle', 'fermenter', 'brite_tank', 'other')),
  capacity_l NUMERIC NOT NULL,
  location_note TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cip_needed', 'maintenance')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access vessels" ON vessels FOR ALL USING (auth.uid() = owner_id);

-- 9. RECIPES
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  style TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access recipes" ON recipes FOR ALL USING (auth.uid() = owner_id);

CREATE TABLE recipe_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  version_number INTEGER NOT NULL DEFAULT 1,
  target_volume_l NUMERIC NOT NULL,
  efficiency_pct NUMERIC DEFAULT 75,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recipe_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access recipe_versions" ON recipe_versions FOR ALL USING (auth.uid() = (SELECT owner_id FROM recipes WHERE id = recipe_versions.recipe_id));

CREATE TABLE recipe_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_version_id UUID NOT NULL REFERENCES recipe_versions(id),
  item_id UUID NOT NULL REFERENCES items(id),
  qty_per_batch NUMERIC NOT NULL,
  stage_hint TEXT CHECK (stage_hint IN ('mash', 'boil', 'fermentation', 'dry_hop', 'packaging', 'other')),
  notes TEXT
);

ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access recipe_items" ON recipe_items FOR ALL USING (auth.uid() = (SELECT owner_id FROM items WHERE id = recipe_items.item_id));

-- 10. BATCHES (Production)
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  batch_number TEXT NOT NULL, -- User friendly ID (e.g., #001)
  recipe_version_id UUID REFERENCES recipe_versions(id),
  name TEXT NOT NULL, -- e.g., "IPA Lote 42"
  
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  stage TEXT DEFAULT 'planning' CHECK (stage IN ('planning', 'mashing', 'boiling', 'fermenting', 'conditioning', 'packaging', 'finished')),
  
  planned_volume_l NUMERIC,
  actual_volume_l NUMERIC, -- Filled at end of production
  
  start_date DATE,
  end_date DATE,
  
  measured_og NUMERIC,
  measured_fg NUMERIC,
  measured_ph NUMERIC,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access batches" ON batches FOR ALL USING (auth.uid() = owner_id);

-- Batch Tank Assignments
CREATE TABLE batch_vessel_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  batch_id UUID NOT NULL REFERENCES batches(id),
  vessel_id UUID NOT NULL REFERENCES vessels(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Constraint: A vessel can strictly check overlap via logic or trigger, simplified constraint here:
  -- We'll rely on app logic + maybe a partial unique index for 'released_at IS NULL' per vessel.
  CONSTRAINT unique_active_vessel_assignment UNIQUE (vessel_id, released_at) -- TRICKY: NULLs in UNIQUE index behave differently in standard SQL, but Postgres supports NULLs as distinct. We need a partial unique index instead.
);

ALTER TABLE batch_vessel_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access assignments" ON batch_vessel_assignments FOR ALL USING (auth.uid() = owner_id);

-- Partial index for uniqueness on active assignments
CREATE UNIQUE INDEX idx_unique_active_vessel ON batch_vessel_assignments (vessel_id) WHERE released_at IS NULL;

-- 11. BATCH CONSUMPTIONS (Real Traceability)
CREATE TABLE batch_consumptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  batch_id UUID NOT NULL REFERENCES batches(id),
  stock_lot_id UUID REFERENCES stock_lots(id), -- Points to specific Supplier Lot!
  item_id UUID NOT NULL REFERENCES items(id), -- Redundant but fast
  qty_consumed NUMERIC NOT NULL CHECK (qty_consumed >= 0),
  consumed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE batch_consumptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access consumptions" ON batch_consumptions FOR ALL USING (auth.uid() = owner_id);

-- 12. PACKAGING RUNS & FINISHED LOTS
CREATE TABLE packaging_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  batch_id UUID NOT NULL REFERENCES batches(id),
  product_id UUID NOT NULL REFERENCES items(id), -- Must be type='product'
  qty_cans_produced INTEGER NOT NULL CHECK (qty_cans_produced >= 0),
  date DATE DEFAULT CURRENT_DATE,
  best_before_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE packaging_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access packaging" ON packaging_runs FOR ALL USING (auth.uid() = owner_id);

CREATE TABLE finished_lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES items(id),
  batch_id UUID NOT NULL REFERENCES batches(id),
  packaging_run_id UUID NOT NULL REFERENCES packaging_runs(id),
  
  lot_code TEXT NOT NULL, -- e.g. 231020-B042
  best_before_date DATE NOT NULL,
  
  qty_produced INTEGER NOT NULL,
  qty_on_hand INTEGER NOT NULL CHECK (qty_on_hand >= 0),
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE finished_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access finished_lots" ON finished_lots FOR ALL USING (auth.uid() = owner_id);

-- Index for FEFO Sales
CREATE INDEX idx_finished_lots_fefo ON finished_lots (product_id, best_before_date ASC) WHERE qty_on_hand > 0;

-- 13. SALES & ALLOCATIONS
CREATE TABLE sales_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  customer_id UUID REFERENCES entities(id),
  order_number TEXT,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access sales" ON sales_orders FOR ALL USING (auth.uid() = owner_id);

CREATE TABLE sales_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
  product_id UUID NOT NULL REFERENCES items(id),
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0)
);

ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access sales_items" ON sales_order_items FOR ALL USING (auth.uid() = (SELECT owner_id FROM sales_orders WHERE id = sales_order_items.sales_order_id));

CREATE TABLE sales_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_order_item_id UUID NOT NULL REFERENCES sales_order_items(id),
  finished_lot_id UUID NOT NULL REFERENCES finished_lots(id),
  qty_allocated INTEGER NOT NULL CHECK (qty_allocated > 0),
  allocated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access allocations" ON sales_allocations FOR ALL USING (auth.uid() = (SELECT owner_id FROM finished_lots WHERE id = sales_allocations.finished_lot_id));

-- 14. INVENTORY MOVEMENTS (The Ledger)
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  item_id UUID NOT NULL REFERENCES items(id),
  stock_lot_id UUID REFERENCES stock_lots(id), -- Nullable for products
  finished_lot_id UUID REFERENCES finished_lots(id), -- Nullable for ingredients
  
  type TEXT NOT NULL CHECK (type IN ('receipt', 'initial_balance', 'adjustment', 'consumption', 'transfer', 'production_yield', 'sale', 'loss', 'return')),
  qty_change NUMERIC NOT NULL, -- Negative for consumption/sale, Positive for receipt/yield
  
  reference_id UUID, -- Generic link to receipt_id, batch_id, sales_order_id
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access movements" ON inventory_movements FOR ALL USING (auth.uid() = owner_id);

-- 15. AUDIT LOGS (Mandatory)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id), -- Can be null if system action
  action TEXT NOT NULL,
  entity_table TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view audit" ON audit_logs FOR SELECT USING (auth.uid() = owner_id);

-- 16. COSTS (Overheads)
CREATE TABLE overhead_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL, -- e.g. "Energy Bill Jan"
  period_start DATE,
  period_end DATE,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE overhead_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access overheads" ON overhead_costs FOR ALL USING (auth.uid() = owner_id);

CREATE TABLE batch_overhead_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  overhead_cost_id UUID NOT NULL REFERENCES overhead_costs(id),
  batch_id UUID NOT NULL REFERENCES batches(id),
  amount_allocated NUMERIC NOT NULL,
  allocation_method TEXT DEFAULT 'volume'
);

ALTER TABLE batch_overhead_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access allocations" ON batch_overhead_allocations FOR ALL USING (auth.uid() = (SELECT owner_id FROM batches WHERE id = batch_overhead_allocations.batch_id));
