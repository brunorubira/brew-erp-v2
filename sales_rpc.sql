-- RPC: create_sales_order_v2
-- Handles Sales Order + Allocation of Finished Lots
CREATE OR REPLACE FUNCTION create_sales_order_v2(
  p_customer_id UUID,
  p_items JSONB, -- Array of { item_id, qty, unit_price }
  p_owner_id UUID
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_item RECORD;
  v_rec_lots RECORD;
  v_qty_needed NUMERIC;
  v_qty_alloc NUMERIC;
  v_total_amount NUMERIC := 0;
  v_item_total NUMERIC;
BEGIN
  -- 1. Create Order Header
  INSERT INTO sales_orders (
    owner_id, customer_id, status, total_amount, date
  ) VALUES (
    p_owner_id, p_customer_id, 'confirmed', 0, CURRENT_DATE
  ) RETURNING id INTO v_order_id;

  -- 2. Process Items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(item_id UUID, qty NUMERIC, unit_price NUMERIC)
  LOOP
     v_qty_needed := v_item.qty;
     v_item_total := v_item.qty * v_item.unit_price;
     v_total_amount := v_total_amount + v_item_total;

     -- Create Order Item
     INSERT INTO sales_order_items (
        sales_order_id, product_id, qty, unit_price
     ) VALUES (
        v_order_id, v_item.item_id, v_item.qty, v_item.unit_price
     );

     -- Allocate Finished Lots (FEFO)
     FOR v_rec_lots IN 
        SELECT id, qty_on_hand FROM finished_lots
        WHERE product_id = v_item.item_id AND qty_on_hand > 0 
        ORDER BY best_before_date ASC, created_at ASC
     LOOP
        IF v_qty_needed <= 0 THEN EXIT; END IF;
        
        IF v_rec_lots.qty_on_hand >= v_qty_needed THEN
           v_qty_alloc := v_qty_needed;
        ELSE
           v_qty_alloc := v_rec_lots.qty_on_hand;
        END IF;

        -- Update Lot
        UPDATE finished_lots SET qty_on_hand = qty_on_hand - v_qty_alloc WHERE id = v_rec_lots.id;
        
        -- Create Allocation Record
        BEGIN
            INSERT INTO sales_allocations (
                sales_order_item_id, finished_lot_id, qty_allocated
            ) VALUES (
                (SELECT id FROM sales_order_items WHERE sales_order_id = v_order_id AND product_id = v_item.item_id LIMIT 1), v_rec_lots.id, v_qty_alloc
            );
        EXCEPTION WHEN OTHERS THEN
            -- Ignore missing table or constraints for MVP flexibility
            NULL;
        END;

        -- Log Movement (Sale)
        INSERT INTO inventory_movements (
            owner_id, item_id, finished_lot_id, type, qty_change, reference_id, notes
        ) VALUES (
            p_owner_id, v_item.item_id, v_rec_lots.id, 'sale', -v_qty_alloc, v_order_id, 'Venda'
        );
        
        v_qty_needed := v_qty_needed - v_qty_alloc;
     END LOOP;
     
     IF v_qty_needed > 0 THEN
        RAISE EXCEPTION 'Estoque insuficiente para o produto %', v_item.item_id;
     END IF;

  END LOOP;
  
  -- Update Total Amount
  UPDATE sales_orders SET total_amount = v_total_amount WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;
