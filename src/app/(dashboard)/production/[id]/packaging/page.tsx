
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Package, Save } from 'lucide-react';
import { createPackagingRun } from '@/app/actions/packaging';

export default async function PackagingPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch Batch info
    const { data: batch } = await supabase.from('batches').select('id, name, batch_number').eq('id', id).single();

    // Fetch Products (Finished Goods) - STRICT 473ml
    const { data: products } = await supabase.from('items').select('id, name').eq('type', 'product').eq('volume_ml', 473);

    // Calculate default Best Before (e.g., +6 months)
    const defaultBestBefore = new Date();
    defaultBestBefore.setMonth(defaultBestBefore.getMonth() + 6);
    const bestBeforeStr = defaultBestBefore.toISOString().split('T')[0];

    async function handleAction(formData: FormData) {
        'use server';
        await createPackagingRun(formData);
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <Link href={`/production/${id}`} className="text-slate-500 hover:text-slate-700">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h2 className="text-2xl font-bold text-slate-800">Envase do Lote: {batch?.name}</h2>
            </div>

            <form action={handleAction} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
                <input type="hidden" name="batch_id" value={id} />

                <div className="bg-blue-50 p-4 rounded text-sm text-blue-700 mb-4">
                    Atenção: Ao confirmar o envase, o sistema irá:
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Criar um Lote de Produto Acabado.</li>
                        <li>Baixar automaticamente estoque de Latas, Tampas e Rótulos (1:1).</li>
                        <li>Marcar o lote de produção como Concluído.</li>
                    </ul>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Produto Final</label>
                    <select name="product_id" className="w-full h-10 px-3 rounded border border-slate-300" required>
                        {products?.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Qtd Latas Produzidas</label>
                        <input name="qty_produced" type="number" className="w-full h-10 px-3 rounded border border-slate-300" required placeholder="Ex: 1000" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Validade (Best Before)</label>
                        <input name="best_before_date" type="date" defaultValue={bestBeforeStr} className="w-full h-10 px-3 rounded border border-slate-300" required />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                    >
                        <Package className="mr-2 h-4 w-4" /> Confirmar Envase
                    </button>
                </div>
            </form>
        </div>
    );
}
