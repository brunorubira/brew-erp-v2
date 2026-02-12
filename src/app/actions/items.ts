'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createItem(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    const name = formData.get('name') as string;
    const type = formData.get('type') as 'ingredient' | 'packaging' | 'product';
    const unit = formData.get('unit') as string;
    const ingredient_category = formData.get('ingredient_category') as string || null;
    const packaging_category = formData.get('packaging_category') as string || null;
    const sku = formData.get('sku') as string || null;
    const volume_ml = formData.get('volume_ml') ? Number(formData.get('volume_ml')) : null;

    if (!name || !type || !unit) {
        return { success: false, message: 'Nome, tipo e unidade são obrigatórios.' };
    }

    const itemData: any = {
        owner_id: user.id,
        name,
        type,
        unit,
        sku,
        is_active: true
    };

    if (type === 'ingredient') {
        itemData.ingredient_category = ingredient_category;
    } else if (type === 'packaging') {
        itemData.packaging_category = packaging_category;
    } else if (type === 'product') {
        itemData.volume_ml = volume_ml || 473;
    }

    const { error } = await supabase.from('items').insert(itemData);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/inventory');
    revalidatePath('/inventory/items');
    return { success: true };
}

export async function deleteItem(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    const { error } = await supabase
        .from('items')
        .update({ is_active: false })
        .eq('id', id)
        .eq('owner_id', user.id);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/inventory');
    revalidatePath('/inventory/items');
    return { success: true };
}
export async function updateItem(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, message: 'Unauthorized' };

    const name = formData.get('name') as string;
    const type = formData.get('type') as 'ingredient' | 'packaging' | 'product';
    const unit = formData.get('unit') as string;
    const ingredient_category = formData.get('ingredient_category') as string || null;
    const packaging_category = formData.get('packaging_category') as string || null;
    const sku = formData.get('sku') as string || null;
    const volume_ml = formData.get('volume_ml') ? Number(formData.get('volume_ml')) : null;

    if (!name || !type || !unit) {
        return { success: false, message: 'Nome, tipo e unidade são obrigatórios.' };
    }

    const itemData: any = {
        name,
        type,
        unit,
        sku
    };

    if (type === 'ingredient') {
        itemData.ingredient_category = ingredient_category;
        itemData.packaging_category = null;
        itemData.volume_ml = null;
    } else if (type === 'packaging') {
        itemData.packaging_category = packaging_category;
        itemData.ingredient_category = null;
        itemData.volume_ml = null;
    } else if (type === 'product') {
        itemData.volume_ml = volume_ml || 473;
        itemData.ingredient_category = null;
        itemData.packaging_category = null;
    }

    const { error } = await supabase
        .from('items')
        .update(itemData)
        .eq('id', id)
        .eq('owner_id', user.id);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/inventory');
    revalidatePath('/inventory/items');
    return { success: true };
}
