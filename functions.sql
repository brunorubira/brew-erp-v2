-- RPC: create_purchase_receipt_v2
-- Handles Receipt + Stock Lots + Inventory Movements transactionally

CREATE OR REPLACE FUNCTION create_purchase_receipt_v2(
  p_receipt JSONB,
  p_items JSONB
) RETURNS UUID AS $$
DECLARE
  v_receipt_id UUID;
  v_item JSONB;
  v_lot_id UUID;
  v_user_id UUID;
BEGIN
  -- Extract owner / user
  v_user_id := (p_receipt->>'owner_id')::UUID;
  
  -- 1. Create Receipt
  INSERT INTO purchase_receipts (
    owner_id,
    supplier_id,
    invoice_number,
    received_at,
    notes,
    status
  ) VALUES (
    v_user_id,
    (p_receipt->>'supplier_id')::UUID,
    p_receipt->>'invoice_number',
    (p_receipt->>'received_at')::TIMESTAMPTZ,
    p_receipt->>'notes',
    'completed'
  ) RETURNING id INTO v_receipt_id;

  -- 2. Loop Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- A. Create Stock Lot
    INSERT INTO stock_lots (
      owner_id,
      item_id,
      supplier_id,
      supplier_lot_code,
      location_id,
      qty_received,
      qty_on_hand,
      unit_cost,
      received_at,
      expiry_date,
      status
    ) VALUES (
      v_user_id,
      (v_item->>'item_id')::UUID,
      (p_receipt->>'supplier_id')::UUID, -- Use supplier from receipt
      v_item->>'supplier_lot_code',
      (v_item->>'location_id')::UUID,
      (v_item->>'qty_received')::NUMERIC,
      (v_item->>'qty_received')::NUMERIC, -- Initial QOH = Received
      (v_item->>'unit_cost')::NUMERIC,
      (p_receipt->>'received_at')::TIMESTAMPTZ,
      (v_item->>'expiry_date')::DATE, -- Can be NULL
      'active'
    ) RETURNING id INTO v_lot_id;

    -- B. Create Inventory Movement (Receipt)
    INSERT INTO inventory_movements (
      owner_id,
      item_id,
      stock_lot_id,
      type,
      qty_change,
      reference_id,
      notes,
      created_at
    ) VALUES (
      v_user_id,
      (v_item->>'item_id')::UUID,
      v_lot_id,
      'receipt',
      (v_item->>'qty_received')::NUMERIC,
      v_receipt_id, -- Link to Receipt
      'Recebimento NF ' || COALESCE(p_receipt->>'invoice_number', ''),
      (p_receipt->>'received_at')::TIMESTAMPTZ
    );

  END LOOP;
  
  -- 3. Update Receipt Total (Calculated)
  UPDATE purchase_receipts
  SET total_amount = (
    SELECT SUM((i->>'qty_received')::NUMERIC * (i->>'unit_cost')::NUMERIC)
    FROM jsonb_array_elements(p_items) i
  )
  WHERE id = v_receipt_id;

  RETURN v_receipt_id;
END;
$$ LANGUAGE plpgsql;
