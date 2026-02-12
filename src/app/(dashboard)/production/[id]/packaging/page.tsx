
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Package, Save } from 'lucide-react';
import { createPackagingRun } from '@/app/actions/packaging';

export default async function PackagingPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch Batch info
    const { data: batch } = await supabase.from('batches').select('id, name, batch_number').eq('id', id).single();

    // Fetch Products (Finished Goods)
    const { data: products } = await supabase.from('items')
        .select('id, name, volume_ml')
        .eq('type', 'product')
        .eq('is_active', true)
        .order('name');

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
                <Link href={`/production/${id}`} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full border border-slate-200 shadow-sm transition-all">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Envase do Lote: {batch?.name}</h2>
            </div>

            <form action={handleAction} className="bg-white p-8 rounded-xl shadow-md border-2 border-slate-100 space-y-8">
                <input type="hidden" name="batch_id" value={id} />

                <div className="bg-amber-50 p-6 rounded-lg border-2 border-amber-100 text-sm text-amber-900 shadow-sm">
                    <h4 className="font-black uppercase tracking-widest text-[10px] text-amber-700 mb-3">O que acontece agora?</h4>
                    <ul className="list-disc pl-5 space-y-2 font-medium">
                        <li>Será criado um <span className="font-bold">Lote de Produto Acabado</span> para venda.</li>
                        <li>
                            Para produtos de <span className="underline font-bold">473ml (Latas)</span>: O sistema baixará automaticamente o estoque de Latas, Tampas e Rótulos.
                        </li>
                        <li>Para <span className="underline font-bold">Barris (30L)</span>: Não haverá baixa automática de embalagens neste momento.</li>
                        <li>O lote de produção será marcado como <span className="font-bold">Concluído</span>.</li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Produto Final / Formato</label>
                    <select name="product_id" className="w-full h-12 px-4 rounded-lg border-2 border-slate-200 focus:border-amber-500 focus:outline-none font-bold text-slate-700 bg-slate-50" required>
                        <option value="">Selecione o produto...</option>
                        {products?.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} ({p.volume_ml >= 1000 ? `${p.volume_ml / 1000}L` : `${p.volume_ml}ml`})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Qtd Produzida (Unidades)</label>
                        <input
                            name="qty_produced"
                            type="number"
                            className="w-full h-12 px-4 rounded-lg border-2 border-slate-200 focus:border-amber-500 focus:outline-none font-bold text-slate-800"
                            required
                            placeholder="Ex: 500 latas ou 10 barris"
                        />
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
