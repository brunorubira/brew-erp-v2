
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';

export default async function SalesPage() {
    const supabase = await createClient();

    const { data: sales } = await supabase
        .from('sales_orders')
        .select(`
        id,
        date,
        total_amount,
        status,
        customer:entities(name)
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

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {sales?.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-slate-500 italic">Nenhuma venda registrada.</td>
                            </tr>
                        ) : (
                            sales?.map((sale) => (
                                <tr key={sale.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                                        {sale.date ? format(new Date(sale.date), 'dd/MM/yyyy') : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                        {(sale.customer as any)?.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-bold">
                                        R$ {sale.total_amount?.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium capitalize">
                                            {sale.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
