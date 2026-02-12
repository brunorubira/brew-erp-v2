export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            items: {
                Row: {
                    id: string
                    owner_id: string
                    name: string
                    type: 'ingredient' | 'packaging' | 'product'
                    unit: 'kg' | 'g' | 'L' | 'un' | 'ml'
                    ingredient_category: 'malt' | 'hops' | 'yeast' | 'adjunct' | 'chemical' | 'other' | null
                    packaging_category: 'can_body' | 'can_lid' | 'label' | 'box' | 'other' | null
                    volume_ml: number | null
                    sku: string | null
                    barcode: string | null
                    description: string | null
                    min_stock_level: number
                    target_stock_level: number
                    lead_time_days: number
                    preferred_supplier_id: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['items']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['items']['Insert']>
            }
            stock_lots: {
                Row: {
                    id: string
                    owner_id: string
                    item_id: string
                    supplier_id: string | null
                    supplier_lot_code: string | null
                    location_id: string | null
                    qty_received: number
                    qty_on_hand: number
                    unit_cost: number
                    received_at: string
                    expiry_date: string | null
                    notes: string | null
                    status: 'active' | 'consumed' | 'expired' | 'quarantine'
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['stock_lots']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['stock_lots']['Insert']>
            }
            inventory_movements: {
                Row: {
                    id: string
                    owner_id: string
                    item_id: string
                    stock_lot_id: string | null
                    finished_lot_id: string | null
                    type: 'receipt' | 'initial_balance' | 'adjustment' | 'consumption' | 'transfer' | 'production_yield' | 'sale' | 'loss' | 'return'
                    qty_change: number
                    reference_id: string | null
                    notes: string | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['inventory_movements']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['inventory_movements']['Insert']>
            }
            purchase_receipts: {
                Row: {
                    id: string
                    owner_id: string
                    supplier_id: string
                    invoice_number: string | null
                    total_amount: number
                    received_at: string
                    status: 'draft' | 'completed'
                    notes: string | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['purchase_receipts']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['purchase_receipts']['Insert']>
            }
            entities: {
                Row: {
                    id: string
                    owner_id: string
                    name: string
                    type: 'supplier' | 'customer'
                    email: string | null
                    phone: string | null
                    tax_id: string | null
                    notes: string | null
                    is_active: boolean
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['entities']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['entities']['Insert']>
            }
            inventory_locations: {
                Row: {
                    id: string
                    owner_id: string
                    name: string
                    type: 'warehouse' | 'cold_storage' | 'production' | 'other' | null
                    is_active: boolean
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['inventory_locations']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['inventory_locations']['Insert']>
            }
            batches: {
                Row: {
                    id: string
                    owner_id: string
                    batch_number: string
                    recipe_version_id: string | null
                    name: string
                    status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
                    stage: 'planning' | 'mashing' | 'boiling' | 'fermenting' | 'conditioning' | 'packaging' | 'finished'
                    planned_volume_l: number
                    actual_volume_l: number | null
                    start_date: string | null
                    end_date: string | null
                    measured_og: number | null
                    measured_fg: number | null
                    measured_ph: number | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['batches']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['batches']['Insert']>
            }
            vessels: {
                Row: {
                    id: string
                    owner_id: string
                    name: string
                    type: 'mash_tun' | 'kettle' | 'fermenter' | 'brite_tank' | 'other'
                    capacity_l: number
                    location_note: string | null
                    status: 'available' | 'occupied' | 'cip_needed' | 'maintenance'
                    is_active: boolean
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['vessels']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['vessels']['Insert']>
            }
            recipes: {
                Row: {
                    id: string
                    owner_id: string
                    name: string
                    style: string | null
                    notes: string | null
                    is_active: boolean
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['recipes']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['recipes']['Insert']>
            }
            recipe_versions: {
                Row: {
                    id: string
                    recipe_id: string
                    version_number: number
                    target_volume_l: number
                    efficiency_pct: number
                    is_current: boolean
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['recipe_versions']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['recipe_versions']['Insert']>
            }
            packaging_runs: {
                Row: {
                    id: string
                    owner_id: string
                    batch_id: string
                    product_id: string
                    qty_cans_produced: number
                    date: string
                    best_before_date: string
                    notes: string | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['packaging_runs']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['packaging_runs']['Insert']>
            }
            finished_lots: {
                Row: {
                    id: string
                    owner_id: string
                    product_id: string
                    batch_id: string
                    packaging_run_id: string
                    lot_code: string
                    best_before_date: string
                    qty_produced: number
                    qty_on_hand: number
                    unit_cost: number
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['finished_lots']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['finished_lots']['Insert']>
            }
            sales_orders: {
                Row: {
                    id: string
                    owner_id: string
                    customer_id: string | null
                    order_number: string | null
                    total_amount: number
                    status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
                    date: string
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['sales_orders']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['sales_orders']['Insert']>
            }
            sales_order_items: {
                Row: {
                    id: string
                    sales_order_id: string
                    product_id: string
                    qty: number
                    unit_price: number
                    total_price?: number
                }
                Insert: Omit<Database['public']['Tables']['sales_order_items']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['sales_order_items']['Insert']>
            }
        }
    }
}
