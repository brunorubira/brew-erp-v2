
import { createClient } from '@/lib/supabase/server';
import { FinishedProductsList } from '@/components/modules/inventory/FinishedProductsList';
import Link from 'next/link';
import { Package, LineChart, Beer } from 'lucide-react';

export default async function FinishedProductsPage() {
    const supabase = await createClient();

    // Fetch Products (Items of type 'product')
    const { data: products, error: productsError } = await supabase
        .from('items')
        .select('id, name, unit, volume_ml')
        .eq('type', 'product')
        .eq('is_active', true);

    // Fetch Finished Lots with Batch Info
    const { data: lots, error: lotsError } = await supabase
        .from('finished_lots')
        .select(`
            *,
            batch:batches(batch_number, name)
        `)
        .gt('qty_on_hand', 0)
        .order('best_before_date', { ascending: true });

    if (productsError || lotsError) {
        console.error(productsError, lotsError);
        return <div>Erro ao carregar estoque de produtos.</div>;
    }

    // Aggregate Data
    const productsStock = (products || []).map(product => {
        const productLots = lots?.filter(l => l.product_id === product.id) || [];
        const totalQty = productLots.reduce((sum, lot) => sum + Number(lot.qty_on_hand), 0);

        return {
            ...product,
            total_qty: totalQty,
            lots: productLots
        };
    }).filter(p => p.lots.length > 0); // Only show products with actual stock

    // Stats
    const totalValue = lots?.reduce((acc, lot) => acc + (Number(lot.qty_on_hand) * Number(lot.unit_cost)), 0) || 0;
    const totalPacks = lots?.reduce((acc, lot) => acc + Number(lot.qty_on_hand), 0) || 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-amber-500 rounded-lg shadow-sm">
                            <Beer className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase">Estoque de Produtos Acabados</h2>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Controle de cervejas envasadas e prontas para venda.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-full">
                        <Package className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Embalagens</p>
                        <p className="text-2xl font-black text-slate-800">{totalPacks.toLocaleString('pt-BR')}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-full">
                        <Tag className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor em Estoque</p>
                        <p className="text-2xl font-black text-slate-800">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-full">
                        <LineChart className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produtos Ativos</p>
                        <p className="text-2xl font-black text-slate-800">{productsStock.length}</p>
                    </div>
                </div>
            </div>

            <FinishedProductsList products={productsStock} />
        </div>
    );
}
