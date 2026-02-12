-- Helper to increment stock lot quantity safely
CREATE OR REPLACE FUNCTION increment_stock_lot_qty(
  lot_id UUID,
  qty_to_add NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE stock_lots
  SET qty_on_hand = qty_on_hand + qty_to_add
  WHERE id = lot_id;
END;
$$ LANGUAGE plpgsql;
