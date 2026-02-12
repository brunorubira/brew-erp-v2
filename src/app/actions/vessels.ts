'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createVessel(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    const name = formData.get('name') as string;
    const type = formData.get('type') as any;
    const capacity = Number(formData.get('capacity_l'));

    if (!name || !type || !capacity) {
        return { success: false, message: 'Dados incompletos' };
    }

    const { error } = await supabase.from('vessels').insert({
        owner_id: user.id,
        name,
        type,
        capacity_l: capacity,
        status: 'available',
        is_active: true
    });

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/production');
    return { success: true };
}

export async function deleteVessel(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    // We don't strictly delete to maintain historical traceability if it was ever used.
    // Instead, we mark it as inactive.
    const { error } = await supabase
        .from('vessels')
        .update({ is_active: false })
        .eq('id', id)
        .eq('owner_id', user.id);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/production');
    return { success: true };
}
export async function updateVessel(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    const name = formData.get('name') as string;
    const type = formData.get('type') as any;
    const capacity = Number(formData.get('capacity_l'));

    if (!name || !type || !capacity) {
        return { success: false, message: 'Dados incompletos' };
    }

    const { error } = await supabase
        .from('vessels')
        .update({
            name,
            type,
            capacity_l: capacity
        })
        .eq('id', id)
        .eq('owner_id', user.id);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/production');
    return { success: true };
}
