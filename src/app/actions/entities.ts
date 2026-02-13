'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createEntity(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    const name = formData.get('name') as string;
    const type = formData.get('type') as 'supplier' | 'customer';
    const email = formData.get('email') as string || null;
    const phone = formData.get('phone') as string || null;
    const tax_id = formData.get('tax_id') as string || null;
    const notes = formData.get('notes') as string || null;

    if (!name || !type) {
        return { success: false, message: 'Nome e tipo são obrigatórios.' };
    }

    const { data, error } = await supabase.from('entities').insert({
        owner_id: user.id,
        name,
        type,
        email,
        phone,
        tax_id,
        notes,
        is_active: true
    }).select().single();

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/customers');
    revalidatePath('/sales/new');
    return { success: true, data: data };
}

export async function updateEntity(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    const name = formData.get('name') as string;
    const email = formData.get('email') as string || null;
    const phone = formData.get('phone') as string || null;
    const tax_id = formData.get('tax_id') as string || null;
    const notes = formData.get('notes') as string || null;

    if (!name) {
        return { success: false, message: 'Nome é obrigatório.' };
    }

    const { error } = await supabase
        .from('entities')
        .update({
            name,
            email,
            phone,
            tax_id,
            notes
        })
        .eq('id', id)
        .eq('owner_id', user.id);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/customers');
    return { success: true, data: null };
}

export async function deleteEntity(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    const { error } = await supabase
        .from('entities')
        .update({ is_active: false })
        .eq('id', id)
        .eq('owner_id', user.id);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/customers');
    return { success: true, data: null };
}
