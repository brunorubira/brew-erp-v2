'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createSalesOrder(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { message: 'Unauthorized' };

    const customerId = formData.get('customer_id') as string;
    // Parse items from form structure.
    // We expect dynamic fields: items[0][id], items[0][qty]...
    // Or simpler: handle single item via form, or JSON string.
    // For robustness, let's assume we parse a JSON string hidden input 'items_json' populated by client JS.
    const itemsJson = formData.get('items_json') as string;

    if (!customerId || !itemsJson) {
        return { success: false, message: 'Dados incompletos' };
    }

    try {
        const items = JSON.parse(itemsJson);

        const { data, error } = await supabase.rpc('create_sales_order_v2', {
            p_customer_id: customerId,
            p_items: items,
            p_owner_id: user.id
        });

        if (error) {
            console.error('RPC Error:', error);
            return { success: false, message: error.message };
        }

        revalidatePath('/sales');
        return { success: true, orderId: data };
    } catch (e: any) {
        console.error('Action Error:', e);
        return { success: false, message: 'Erro interno: ' + e.message };
    }
}
