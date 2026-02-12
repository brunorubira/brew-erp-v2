-- Seed Data for Nano Brewery ERP V2
-- Run this after schema.sql and functions.sql

-- Note: In Supabase SQL Editor, you might need to hardcode the owner_id or run as a specific user.
-- For this seed, we will assume a placeholder UUID for owner_id or let the user replace it.
-- variable: v_owner_id

DO $$
DECLARE
  v_owner_id UUID;
  v_loc_warehouse UUID;
  v_loc_cold UUID;
  v_loc_prod UUID;
  v_supp_maltaria UUID;
  v_supp_latas UUID;
  v_cust_pub UUID;
  v_item_malt UUID;
  v_item_hops UUID;
  v_item_yeast UUID;
  v_item_can_body UUID;
  v_item_can_lid UUID;
  v_item_label UUID;
  v_product_ipa UUID;
  v_recipe_ipa UUID;
  v_recipe_ver UUID;
BEGIN
  -- 0. Get a user ID (First user found or specific)
  -- REPLACE THIS WITH YOUR ACTUAL USER ID IF NEEDED
  SELECT id INTO v_owner_id FROM auth.users LIMIT 1;
  
  -- If no user, create a dummy one purely for constraint satisfaction if run locally, 
  -- but in Supabase you usually have a user. If null, we might fail RLS or constraints.
  -- Let's assume the script is run in a context where we can get a user or we just insert one.
  -- For safety, if v_owner_id is NULL, we raise notice.
  IF v_owner_id IS NULL THEN
    RAISE NOTICE 'No user found in auth.users. Please create a user first.';
    RETURN;
  END IF;

  -- 1. Locations
  INSERT INTO inventory_locations (owner_id, name, type) VALUES 
  (v_owner_id, 'Almoxarifado Geral', 'warehouse') RETURNING id INTO v_loc_warehouse;
  
  INSERT INTO inventory_locations (owner_id, name, type) VALUES 
  (v_owner_id, 'Câmara Fria', 'cold_storage') RETURNING id INTO v_loc_cold;
  
  INSERT INTO inventory_locations (owner_id, name, type) VALUES 
  (v_owner_id, 'Área de Produção', 'production') RETURNING id INTO v_loc_prod;

  -- 2. Tanks
  INSERT INTO vessels (owner_id, name, type, capacity_l) VALUES
  (v_owner_id, 'FV-01', 'fermenter', 500),
  (v_owner_id, 'FV-02', 'fermenter', 500),
  (v_owner_id, 'FV-03', 'fermenter', 500),
  (v_owner_id, 'BBT-01', 'brite_tank', 500);

  -- 3. Entities
  INSERT INTO entities (owner_id, name, type, notes) VALUES
  (v_owner_id, 'Maltaria Agrária', 'supplier', 'Fornecedor de Malte') RETURNING id INTO v_supp_maltaria;
  
  INSERT INTO entities (owner_id, name, type, notes) VALUES
  (v_owner_id, 'LataPack', 'supplier', 'Latas e Tampas') RETURNING id INTO v_supp_latas;
  
  INSERT INTO entities (owner_id, name, type, notes) VALUES
  (v_owner_id, 'Pub da Esquina', 'customer', 'Cliente recorrente') RETURNING id INTO v_cust_pub;

  -- 4. Items
  -- Ingredients
  INSERT INTO items (owner_id, name, type, unit, ingredient_category, min_stock_level, preferred_supplier_id) VALUES
  (v_owner_id, 'Malte Pilsen', 'ingredient', 'kg', 'malt', 100, v_supp_maltaria) RETURNING id INTO v_item_malt;
  
  INSERT INTO items (owner_id, name, type, unit, ingredient_category) VALUES
  (v_owner_id, 'Lúpulo Citra', 'ingredient', 'kg', 'hops') RETURNING id INTO v_item_hops;
  
  INSERT INTO items (owner_id, name, type, unit, ingredient_category) VALUES
  (v_owner_id, 'Fermento US-05', 'ingredient', 'g', 'yeast') RETURNING id INTO v_item_yeast;
  
  -- Packaging (Can 473ml components)
  INSERT INTO items (owner_id, name, type, unit, packaging_category) VALUES
  (v_owner_id, 'Corpo Lata 473ml', 'packaging', 'un', 'can_body') RETURNING id INTO v_item_can_body;
  
  INSERT INTO items (owner_id, name, type, unit, packaging_category) VALUES
  (v_owner_id, 'Tampa Lata 202', 'packaging', 'un', 'can_lid') RETURNING id INTO v_item_can_lid;

  INSERT INTO items (owner_id, name, type, unit, packaging_category) VALUES
  (v_owner_id, 'Rótulo IPA Lote', 'packaging', 'un', 'label') RETURNING id INTO v_item_label;
  
  -- Product
  INSERT INTO items (owner_id, name, type, unit, volume_ml, description) VALUES
  (v_owner_id, 'IPA Clássica 473ml', 'product', 'un', 473, 'Nossa IPA carro chefe') RETURNING id INTO v_product_ipa;

  -- 5. Recipe
  INSERT INTO recipes (owner_id, name, style) VALUES
  (v_owner_id, 'IPA Clássica', 'American IPA') RETURNING id INTO v_recipe_ipa;
  
  INSERT INTO recipe_versions (recipe_id, version_number, target_volume_l, efficiency_pct, is_current) VALUES
  (v_recipe_ipa, 1, 500, 75, TRUE) RETURNING id INTO v_recipe_ver;
  
  -- Recipe Items
  INSERT INTO recipe_items (recipe_version_id, item_id, qty_per_batch, stage_hint) VALUES
  (v_recipe_ver, v_item_malt, 120, 'mash'),
  (v_recipe_ver, v_item_hops, 2.5, 'boil'),
  (v_recipe_ver, v_item_yeast, 500, 'fermentation'); -- 500g

  -- 6. Initial Stock (via Stock Lots directly for seed, though normally via Receipt)
  -- Receipt 1: Malts
  INSERT INTO purchase_receipts (owner_id, supplier_id, invoice_number, total_amount, received_at) VALUES
  (v_owner_id, v_supp_maltaria, 'NF-001', 1200, NOW() - INTERVAL '10 days');
  
  INSERT INTO stock_lots (owner_id, item_id, supplier_id, supplier_lot_code, location_id, qty_received, qty_on_hand, unit_cost, received_at) VALUES
  (v_owner_id, v_item_malt, v_supp_maltaria, 'LOTE-MALT-01', v_loc_warehouse, 500, 500, 5.50, NOW() - INTERVAL '10 days');
  
  -- Receipt 2: Hops & Yeast (Yeast needs expiry!)
  INSERT INTO purchase_receipts (owner_id, supplier_id, invoice_number, total_amount, received_at) VALUES
  (v_owner_id, v_supp_maltaria, 'NF-002', 5000, NOW() - INTERVAL '5 days');

  INSERT INTO stock_lots (owner_id, item_id, supplier_id, supplier_lot_code, location_id, qty_received, qty_on_hand, unit_cost, received_at, expiry_date) VALUES
  (v_owner_id, v_item_hops, v_supp_maltaria, 'LOTE-HOPS-A', v_loc_cold, 20, 20, 200.00, NOW() - INTERVAL '5 days', NOW() + INTERVAL '1 year'),
  (v_owner_id, v_item_yeast, v_supp_maltaria, 'LOTE-YEAST-X', v_loc_cold, 5000, 5000, 0.80, NOW() - INTERVAL '5 days', NOW() + INTERVAL '6 months');

  -- Initial Finished Product Stock
  INSERT INTO finished_lots (owner_id, product_id, lot_code, qty_produced, qty_on_hand, unit_cost, best_before_date) VALUES
  (v_owner_id, v_product_ipa, 'LOTE-IPA-01', 100, 100, 3.50, NOW() + INTERVAL '4 months');

END $$;
