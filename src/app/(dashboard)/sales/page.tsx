import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { SalesListClient } from './SalesListClient';

export default async function SalesPage() {
    const supabase = await createClient();

    const { data: sales } = await supabase
        .from('sales_orders')
        .select(`
            id,
            date,
            total_amount,
            status,
            customer:entities(id, name),
            items:sales_order_items(
                id,
                qty,
                unit_price,
                product:items(name)
            )
        `)
        .order('date', { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800">Vendas</h2>
                    <p className="text-slate-500">Pedidos e Saída de Estoque</p>
                </div>
                <Link
                    href="/sales/new"
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                    <Plus className="mr-2 h-4 w-4" /> Nova Venda
                </Link>
            </div>

            <SalesListClient initialSales={sales || []} />
        </div>
    );
}
