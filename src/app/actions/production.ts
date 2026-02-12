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
