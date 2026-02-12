
import { createClient } from '@/lib/supabase/server';
import { Activity, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default async function DashboardPage() {
    const supabase = await createClient();

    // Fetch KPI Data
    const [
        { count: salesCount },
        { data: activeBatches },
        { data: items }
    ] = await Promise.all([
        supabase.from('sales_orders').select('*', { count: 'exact', head: true }).eq('date', new Date().toISOString().split('T')[0]),
        supabase.from('batches').select('id, name, stage').neq('status', 'completed').neq('status', 'cancelled'),
        supabase.from('items').select('id').eq('is_active', true)
    ]);

    const { data: recentSales } = await supabase
        .from('sales_orders')
        .select('id, total_amount, date, customer:entities(name)')
        .order('date', { ascending: false })
        .limit(5);

    const { data: recentProduction } = await supabase
        .from('batches')
        .select('id, name, stage, status')
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI Cards */}
                <Link href="/sales" className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:border-amber-400 transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Vendas Hoje</p>
                            <h3 className="text-2xl font-bold text-slate-800">{salesCount || 0}</h3>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-green-500 opacity-20 group-hover:opacity-40 transition-opacity" />
                    </div>
                </Link>

                <Link href="/production" className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:border-amber-400 transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Lotes Ativos</p>
                            <h3 className="text-2xl font-bold text-slate-800">{activeBatches?.length || 0}</h3>
                        </div>
                        <Activity className="h-8 w-8 text-amber-500 opacity-20 group-hover:opacity-40 transition-opacity" />
                    </div>
                </Link>

                <Link href="/inventory" className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:border-amber-400 transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Itens Ativos</p>
                            <h3 className="text-2xl font-bold text-slate-800">{items?.length || 0}</h3>
                        </div>
                        <Package className="h-8 w-8 text-blue-500 opacity-20 group-hover:opacity-40 transition-opacity" />
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Production */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-semibold text-slate-700">Produção Recente</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {recentProduction?.map(batch => (
                                <div key={batch.id} className="flex justify-between items-center border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                                    <div>
                                        <p className="font-medium text-slate-800">{batch.name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{batch.stage}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${batch.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {batch.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                            {recentProduction?.length === 0 && <p className="text-slate-500 text-sm">Nenhum lote recente.</p>}
                        </div>
                    </div>
                </div>

                {/* Recent Sales */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-semibold text-slate-700">Vendas Recentes</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {recentSales?.map(sale => (
                                <div key={sale.id} className="flex justify-between items-center border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                                    <div>
                                        <p className="font-medium text-slate-800">{(sale.customer as any)?.name}</p>
                                        <p className="text-xs text-slate-500">{sale.date ? format(new Date(sale.date), 'dd/MM/yyyy') : '-'}</p>
                                    </div>
                                    <span className="font-bold text-slate-700">R$ {sale.total_amount?.toFixed(2)}</span>
                                </div>
                            ))}
                            {recentSales?.length === 0 && <p className="text-slate-500 text-sm">Nenhuma venda recente.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
