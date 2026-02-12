'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPackagingRun(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { message: 'Unauthorized' };

    const batchId = formData.get('batch_id') as string;
    const productId = formData.get('product_id') as string;
    const qty = Number(formData.get('qty_produced'));
    const bestBefore = formData.get('best_before_date') as string;

    if (!batchId || !productId || !qty || !bestBefore) {
        return { success: false, message: 'Dados incompletos' };
    }

    // Call RPC
    const { data, error } = await supabase.rpc('create_packaging_run_v2', {
        p_batch_id: batchId,
        p_product_id: productId,
        p_qty_produced: qty,
        p_best_before_date: bestBefore,
        p_owner_id: user.id
    });

    if (error) {
        console.error('Packaging Error:', error);
        return { success: false, message: error.message };
    }

    revalidatePath('/production');
    revalidatePath('/inventory'); // Products updated
    redirect('/production'); // Back to list
}
