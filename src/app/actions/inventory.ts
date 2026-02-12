'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type StockLotInsert = Database['public']['Tables']['stock_lots']['Insert'];
type PurchaseReceiptInsert = Database['public']['Tables']['purchase_receipts']['Insert'];
type InventoryMovementInsert = Database['public']['Tables']['inventory_movements']['Insert'];

interface PurchaseItemInput {
    item_id: string;
    supplier_lot_code: string; // Mandatory for traceability
    qty_received: number;
    unit_cost: number;
    location_id: string;
    expiry_date?: string | null; // Mandatory for yeast
}

interface CreatePurchaseReceiptParams {
    supplier_id: string;
    invoice_number?: string;
    date: string;
    notes?: string;
    items: PurchaseItemInput[];
}

export async function createPurchaseReceipt(
    params: CreatePurchaseReceiptParams
) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // 1. Validate Yeast Expiry
    // We need to fetch item types to validate yeast expiry if not provided
    // For performance, we'll assume the client sent the correct data or fail at DB level if we had constraints,
    // but the requirement says "Application Logic" for yeast expiry.
    // Let's fetch the items involved to check types.
    const itemIds = params.items.map(i => i.item_id);
    const { data: dbItems, error: itemsError } = await supabase
        .from('items')
        .select('id, name, type, ingredient_category')
        .in('id', itemIds);

    if (itemsError) throw new Error('Failed to validate items');

    const itemsMap = new Map(dbItems?.map(i => [i.id, i]));

    for (const item of params.items) {
        const dbItem = itemsMap.get(item.item_id);
        if (!dbItem) throw new Error(`Item not found: ${item.item_id}`);

        if (
            dbItem.type === 'ingredient' &&
            dbItem.ingredient_category === 'yeast' &&
            !item.expiry_date
        ) {
            throw new Error(`Expiry date is mandatory for Yeast: ${dbItem.name}`);
        }
    }

    // 2. Perform Transaction (Supabase doesn't have multi-table transaction API in JS client yet easily without RPC, 
    // but we can chain operations. If one fails, we have partial data. 
    // Ideally, this should be a Postgres Function (RPC). 
    // User requested "Code real ready to run". RPC is best for atomicity. 
    // BUT user also said "SQL Complete" and I didn't add the RPC there.
    // I will implement it here with best-effort, or better, I will create a SQL RPC now if I can?
    // No, I'll stick to JS logic for now as I can't easily run SQL migrations interactively without tool access to DB console.
    // Actually, I can write the logic to be robust or just accept it's an MVP.
    // Wait, "Operations critical with transactions (mandatory)".
    // "Implement as Server Actions / Route Handlers with transactions".
    // Since Supabase Direct POSTGRES access isn't available to me (only HTTP), I cannot do true transactions without RPC.
    // I will write the RPC SQL and ask the user to run it, OR I will assume I can just use sequential inserts and handle errors (not true transaction).
    // The user prompt said: "Crie SQL completo...". I created `schema.sql`. 
    // I missed the RPCs!
    // I should probably add the RPC to `schema.sql` or a new file `functions.sql`.
    // For now, I will write the Server Action to call an RPC `create_purchase_receipt` which I will define.

    // Let's define the JS logic here, and if I can't deploy the RPC, I'll rely on the user.
    // Actually, the prompt says "Code real ready to run". 
    // I will write the RPC in a new SQL file and assume the user runs it.
    // AND I will use the RPC in this action.

    // WAIT. I can't use RPC if I haven't defined it.
    // I'll stick to sequential inserts for the Immediate MVP and add a note, 
    // OR I can just write the RPC now.
    // Writing the RPC is safer and meets requirements.

    try {
        const { data, error } = await supabase.rpc('create_purchase_receipt_v2', {
            p_receipt: {
                supplier_id: params.supplier_id,
                invoice_number: params.invoice_number,
                received_at: params.date,
                notes: params.notes,
                owner_id: user.id
            },
            p_items: params.items.map(i => ({
                item_id: i.item_id,
                supplier_lot_code: i.supplier_lot_code,
                location_id: i.location_id,
                qty_received: i.qty_received,
                unit_cost: i.unit_cost,
                expiry_date: i.expiry_date,
                owner_id: user.id
            }))
        });

        if (error) {
            console.error('RPC Error:', error);
            throw new Error(error.message);
        }

        revalidatePath('/inventory');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
export async function updateStockLot(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    const qty = Number(formData.get('qty_on_hand'));
    const unit_cost = Number(formData.get('unit_cost'));
    const expiry_date = formData.get('expiry_date') as string || null;
    const location_id = formData.get('location_id') as string;

    if (isNaN(qty) || isNaN(unit_cost) || !location_id) {
        return { success: false, message: 'Dados inválidos' };
    }

    const { error } = await supabase
        .from('stock_lots')
        .update({
            qty_on_hand: qty,
            unit_cost,
            expiry_date,
            location_id
        })
        .eq('id', id)
        .eq('owner_id', user.id);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/inventory');
    return { success: true };
}
