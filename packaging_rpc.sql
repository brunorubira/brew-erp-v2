-- RPC: create_packaging_run_v2
-- Handles Packaging Run + Finished Lot Creation + Packaging Materials Consumption + Costing

CREATE OR REPLACE FUNCTION create_packaging_run_v2(
  p_batch_id UUID,
  p_product_id UUID,
  p_qty_produced INTEGER,
  p_best_before_date DATE,
  p_owner_id UUID
) RETURNS UUID AS $$
DECLARE
  v_run_id UUID;
  v_finished_lot_id UUID;
  v_lot_code TEXT;
  v_rec_items RECORD;
  v_qty_needed NUMERIC;
  v_item_id UUID;
  v_packaging_category TEXT;
  
  -- Costing Variables
  v_total_ingredients_cost NUMERIC := 0;
  v_total_packaging_cost NUMERIC := 0;
  v_total_cost NUMERIC;
  v_unit_cost NUMERIC;
BEGIN
  -- 1. Create Packaging Run
  INSERT INTO packaging_runs (
    owner_id, batch_id, product_id, qty_cans_produced, best_before_date, date
  ) VALUES (
    p_owner_id, p_batch_id, p_product_id, p_qty_produced, p_best_before_date, CURRENT_DATE
  ) RETURNING id INTO v_run_id;

  -- 2. Calculate Ingredients Cost (from Batch Consumptions)
  -- Join stock_lots to get unit_cost at time of consumption? 
  -- Ideally batch_consumptions should store cost_at_consumption, but for now we look up stock_lots.unit_cost.
  -- Limitation: If stock lot unit_cost changed? Usually it shouldn't for a specific lot.
  SELECT COALESCE(SUM(bc.qty_consumed * sl.unit_cost), 0)
  INTO v_total_ingredients_cost
  FROM batch_consumptions bc
  JOIN stock_lots sl ON bc.stock_lot_id = sl.id
  WHERE bc.batch_id = p_batch_id;

  -- 3. Auto-Consume Packaging Materials & Calc Cost
  -- Only for Cans (identified by volume_ml = 473)
  DECLARE
    v_prod_vol INTEGER;
  BEGIN
    SELECT volume_ml INTO v_prod_vol FROM items WHERE id = p_product_id;
    
    IF v_prod_vol = 473 THEN
      FOR v_packaging_category IN SELECT unnest(ARRAY['can_body', 'can_lid', 'label'])
      LOOP
         SELECT id INTO v_item_id FROM items WHERE owner_id = p_owner_id AND packaging_category = v_packaging_category AND is_active = true LIMIT 1;
         
         IF v_item_id IS NOT NULL THEN
           v_qty_needed := p_qty_produced;
           
           FOR v_rec_items IN 
              SELECT id, qty_on_hand, unit_cost FROM stock_lots 
              WHERE item_id = v_item_id AND qty_on_hand > 0 AND status = 'active'
              ORDER BY expiry_date ASC, received_at ASC
           LOOP
              IF v_qty_needed <= 0 THEN EXIT; END IF;
    
              DECLARE
                v_consume NUMERIC;
                v_cost NUMERIC;
              BEGIN
                IF v_rec_items.qty_on_hand >= v_qty_needed THEN
                   v_consume := v_qty_needed;
                ELSE
                   v_consume := v_rec_items.qty_on_hand;
                END IF;
                
                -- Track Cost
                v_cost := v_consume * v_rec_items.unit_cost;
                v_total_packaging_cost := v_total_packaging_cost + v_cost;
    
                -- Update Lot
                UPDATE stock_lots SET qty_on_hand = qty_on_hand - v_consume WHERE id = v_rec_items.id;
                
                -- Log Movement
                INSERT INTO inventory_movements (owner_id, item_id, stock_lot_id, type, qty_change, reference_id, notes)
                VALUES (p_owner_id, v_item_id, v_rec_items.id, 'consumption', -v_consume, v_run_id, 'Consumo Envase Auto');
                
                v_qty_needed := v_qty_needed - v_consume;
              END;
           END LOOP;
         END IF;
      END LOOP;
    END IF;
  END;

  -- 4. Calculate Final Unit Cost
  v_total_cost := v_total_ingredients_cost + v_total_packaging_cost;
  IF p_qty_produced > 0 THEN
      v_unit_cost := v_total_cost / p_qty_produced;
  ELSE
      v_unit_cost := 0;
  END IF;

  -- 5. Generate Lot Code & Create Finished Lot
  v_lot_code := to_char(CURRENT_DATE, 'YYMMDD') || '-B' || substr(p_batch_id::text, 1, 4) || '-P' || p_qty_produced;

  INSERT INTO finished_lots (
    owner_id, product_id, batch_id, packaging_run_id, lot_code, best_before_date, qty_produced, qty_on_hand, unit_cost
  ) VALUES (
    p_owner_id, p_product_id, p_batch_id, v_run_id, v_lot_code, p_best_before_date, p_qty_produced, p_qty_produced, v_unit_cost
  ) RETURNING id INTO v_finished_lot_id;
  
  -- 6. Log Movement (Yield)
  INSERT INTO inventory_movements (
    owner_id, item_id, finished_lot_id, type, qty_change, reference_id, notes
  ) VALUES (
    p_owner_id, p_product_id, v_finished_lot_id, 'production_yield', p_qty_produced, v_run_id, 'Envase Lote'
  );

  -- 7. Update Batch Volume and Status
  -- Calculate volume removed in liters
  DECLARE
    v_prod_vol INTEGER;
    v_vol_removed_l NUMERIC;
  BEGIN
    SELECT volume_ml INTO v_prod_vol FROM items WHERE id = p_product_id;
    v_vol_removed_l := (p_qty_produced * COALESCE(v_prod_vol, 0)) / 1000.0;
    
    UPDATE batches 
    SET actual_volume_l = COALESCE(actual_volume_l, 0) - v_vol_removed_l,
        status = CASE WHEN (COALESCE(actual_volume_l, 0) - v_vol_removed_l) <= 0 THEN 'completed' ELSE status END,
        stage = CASE WHEN (COALESCE(actual_volume_l, 0) - v_vol_removed_l) <= 0 THEN 'finished' ELSE stage END,
        end_date = CASE WHEN (COALESCE(actual_volume_l, 0) - v_vol_removed_l) <= 0 THEN CURRENT_DATE ELSE end_date END
    WHERE id = p_batch_id;
  END;

  RETURN v_run_id;
END;
$$ LANGUAGE plpgsql;
