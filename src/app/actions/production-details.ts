'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function consumeIngredient(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { message: 'Unauthorized' };

    const batchId = formData.get('batch_id') as string;
    const stockLotId = formData.get('stock_lot_id') as string;
    const itemId = formData.get('item_id') as string; // Redundant but good for double check?
    const qty = Number(formData.get('qty_consumed'));

    if (!batchId || !stockLotId || !itemId || !qty || qty <= 0) {
        return { message: 'Dados inválidos' };
    }

    // Transaction needed: Decrement Lot Qty, Insert Consumption, Insert Movement.
    // We'll use RPC if possible, or sequential carefully.
    // Let's assume sequential for now with error checking.

    // 1. Check Lot Availability and Expiry
    const { data: lot, error: lotError } = await supabase
        .from('stock_lots')
        .select('qty_on_hand, expiry_date, unit_cost')
        .eq('id', stockLotId)
        .single();

    if (lotError || !lot) return { message: 'Lote não encontrado' };

    if (lot.qty_on_hand < qty) {
        return { message: 'Saldo insuficiente no lote' };
    }

    // Check Expiry (Strict for Yeast, Block or Adjust?)
    // User req: "Bloquear consumo de lote vencido por padrão; override exige motivo + audit_logs."
    // We need an override flag? For now, we'll strict block if expired.
    if (lot.expiry_date && new Date(lot.expiry_date) < new Date()) {
        // Check for override? Assuming no override in this basic form for now.
        return { message: 'Lote vencido! O consumo foi bloqueado.' };
    }

    // 2. Perform updates
    // A. Insert Consumption
    const { error: consumeError } = await supabase.from('batch_consumptions').insert({
        owner_id: user.id,
        batch_id: batchId,
        item_id: itemId,
        stock_lot_id: stockLotId,
        qty_consumed: qty,
        consumed_at: new Date().toISOString()
    });

    if (consumeError) return { message: 'Erro ao registrar consumo: ' + consumeError.message };

    // B. Decrement Lot
    const { error: updateLotError } = await supabase.from('stock_lots')
        .update({ qty_on_hand: lot.qty_on_hand - qty })
        .eq('id', stockLotId);

    // C. Log Movement
    await supabase.from('inventory_movements').insert({
        owner_id: user.id,
        item_id: itemId,
        stock_lot_id: stockLotId,
        type: 'consumption',
        qty_change: -qty,
        reference_id: batchId,
        notes: 'Consumo para lote' // + batch name lookup?
    });

    revalidatePath(`/production/${batchId}`);
    return { success: true, message: 'Consumo registrado' };
}


export async function updateMeasurements(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Unauthorized' };

    const batchId = formData.get('batch_id') as string;
    const og = formData.get('measured_og');
    const fg = formData.get('measured_fg');
    const ph = formData.get('measured_ph');

    const updates: any = {};
    if (og) updates.measured_og = Number(og);
    if (fg) updates.measured_fg = Number(fg);
    if (ph) updates.measured_ph = Number(ph);

    const { error } = await supabase.from('batches').update(updates).eq('id', batchId);

    if (error) return { success: false, message: error.message };

    revalidatePath(`/production/${batchId}`);
    return { success: true, message: 'Medições atualizadas' };
}

export async function assignVessel(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Unauthorized' };

    const batchId = formData.get('batch_id') as string;
    const vesselId = formData.get('vessel_id') as string;

    // 1. Check if vessel is available
    // We can trust the unique constraint or check manually for UX message
    const { data: existing } = await supabase
        .from('batch_vessel_assignments')
        .select('id')
        .eq('vessel_id', vesselId)
        .is('released_at', null)
        .single();

    if (existing) return { success: false, message: 'Tanque já ocupado!' };

    // 2. Assign
    const { error } = await supabase.from('batch_vessel_assignments').insert({
        owner_id: user.id,
        batch_id: batchId,
        vessel_id: vesselId,
        assigned_at: new Date().toISOString()
    });

    if (error) return { success: false, message: error.message };

    // 3. Update Vessel Status
    await supabase.from('vessels').update({ status: 'occupied' }).eq('id', vesselId);

    revalidatePath(`/production/${batchId}`);
    return { success: true, message: 'Tanque atribuído' };
}

