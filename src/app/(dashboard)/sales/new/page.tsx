
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NewSalesOrderForm } from '@/components/modules/sales/NewSalesOrderForm';

export default async function NewSalesPage() {
    const supabase = await createClient();

    const [customersRes, productsRes] = await Promise.all([
        supabase.from('entities').select('id, name').eq('type', 'customer').eq('is_active', true).order('name'),
        supabase.from('items').select('id, name').eq('type', 'product').eq('is_active', true).order('name')
    ]);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/sales" className="text-slate-500 hover:text-slate-700">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h2 className="text-2xl font-bold text-slate-800">Nova Venda</h2>
            </div>

            <NewSalesOrderForm
                customers={customersRes.data || []}
                products={productsRes.data || []}
            />
        </div>
    );
}
