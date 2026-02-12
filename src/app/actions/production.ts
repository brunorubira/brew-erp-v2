'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type BatchInsert = Database['public']['Tables']['batches']['Insert'];

export async function createBatch(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const recipe_version_id = formData.get('recipe_version_id') as string;
    const planned_volume_l = Number(formData.get('planned_volume_l'));
    const start_date = formData.get('start_date') as string;

    // Basic validation
    if (!name || !planned_volume_l || !start_date) {
        return { success: false, error: 'Campos obrigatórios faltando' };
    }

    // Generate a Batch Number (Simple auto-increment logic or random for MVP)
    // Real app: use a sequence or query max.
    // We'll use a simple timestamp-based suffix for now or just "Lote X".
    const batch_number = `LOTE-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;

    const { data, error } = await supabase.from('batches').insert({
        owner_id: user.id,
        name,
        batch_number,
        recipe_version_id: recipe_version_id || null,
        planned_volume_l,
        start_date,
        status: 'planned',
        stage: 'planning'
    }).select().single();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/production');
    return { success: true, batchId: data.id };
}

export async function updateBatch(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const name = formData.get('name') as string;
    const status = formData.get('status') as string;
    const stage = formData.get('stage') as string;
    const measured_og = formData.get('measured_og') ? Number(formData.get('measured_og')) : null;
    const measured_fg = formData.get('measured_fg') ? Number(formData.get('measured_fg')) : null;
    const measured_ph = formData.get('measured_ph') ? Number(formData.get('measured_ph')) : null;
    const actual_volume_l = formData.get('actual_volume_l') ? Number(formData.get('actual_volume_l')) : null;
    const notes = formData.get('notes') as string;

    const { error } = await supabase
        .from('batches')
        .update({
            name,
            status,
            stage,
            measured_og,
            measured_fg,
            measured_ph,
            actual_volume_l,
            notes,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', user.id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/production');
    revalidatePath(`/production/${id}`);
    return { success: true };
}

export async function deleteConsumption(consumptionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // 1. Get consumption details
    const { data: consumption, error: fetchError } = await supabase
        .from('batch_consumptions')
        .select('*, stock_lot_id, qty_consumed, batch_id')
        .eq('id', consumptionId)
        .eq('owner_id', user.id)
        .single();

    if (fetchError || !consumption) {
        return { success: false, error: 'Consumo não encontrado' };
    }

    // 2. Transactional delete and stock reversal
    // Note: Using individual calls because there's no complex procedure for this yet.
    // In a production app, an RPC/Function would be better.

    // Delete consumption
    const { error: deleteError } = await supabase
        .from('batch_consumptions')
        .delete()
        .eq('id', consumptionId)
        .eq('owner_id', user.id);

    if (deleteError) {
        return { success: false, error: deleteError.message };
    }

    // Restore stock if it was linked to a lot
    if (consumption.stock_lot_id) {
        const { error: stockError } = await supabase.rpc('increment_stock_lot_qty', {
            lot_id: consumption.stock_lot_id,
            qty_to_add: consumption.qty_consumed
        });

        if (stockError) {
            console.error('Error restoring stock:', stockError);
            // This is a partial failure state in a non-atomic environment.
        }
    }

    revalidatePath('/production');
    revalidatePath(`/production/${consumption.batch_id}`);
    revalidatePath('/inventory');

    return { success: true };
}
export async function deleteBatch(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // 1. Get active assignments to release vessels
    const { data: assignments } = await supabase
        .from('batch_vessel_assignments')
        .select('vessel_id')
        .eq('batch_id', id)
        .is('released_at', null);

    if (assignments && assignments.length > 0) {
        const vesselIds = assignments.map(a => a.vessel_id);
        await supabase
            .from('vessels')
            .update({ status: 'available' })
            .in('id', vesselIds);
    }

    // 2. Delete the batch (assuming no production data like packaging runs exist yet, or let DB error handle it)
    // If there are packaging runs, deletion might fail due to FK constraints.
    // For now, we'll try to delete.
    const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

    if (error) {
        return { success: false, error: 'Não é possível excluir um lote que já possui registros de envase ou consumos. ' + error.message };
    }

    revalidatePath('/production');
    redirect('/production');
}
