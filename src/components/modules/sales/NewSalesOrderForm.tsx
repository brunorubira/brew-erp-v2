'use client';

import { useState } from 'react';
import { createSalesOrder } from '@/app/actions/sales';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NewSalesOrderForm({ customers, products }: { customers: any[], products: any[] }) {
    const router = useRouter();
    const [lines, setLines] = useState<any[]>([{ tempId: 1, item_id: '', qty: 1, unit_price: 0 }]);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState('');

    const addLine = () => {
        setLines([...lines, { tempId: Date.now(), item_id: '', qty: 1, unit_price: 0 }]);
    };

    const removeLine = (id: number) => {
        setLines(lines.filter(l => l.tempId !== id));
    };

    const updateLine = (id: number, field: string, value: any) => {
        setLines(lines.map(l => l.tempId === id ? { ...l, [field]: value } : l));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        // Transform lines to JSON
        const items = lines.map(l => ({
            item_id: l.item_id,
            qty: Number(l.qty),
            unit_price: Number(l.unit_price)
        }));
        formData.append('items_json', JSON.stringify(items));

        const res = await createSalesOrder(formData);

        if (!res.success) {
            setError(res.message || 'Erro ao criar pedido');
            setIsPending(false);
        } else {
            router.push('/sales');
        }
    };

    const total = lines.reduce((sum, line) => sum + (line.qty * line.unit_price), 0);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="mb-4">
                    <label className="text-sm font-medium text-slate-700">Cliente</label>
                    <select name="customer_id" className="w-full mt-1 p-2 border border-slate-300 rounded" required>
                        <option value="">Selecione...</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-semibold text-slate-700">Itens do Pedido</h3>
                        <button type="button" onClick={addLine} className="text-xs flex items-center text-amber-600 hover:text-amber-700">
                            <Plus className="h-3 w-3 mr-1" /> Adicionar Item
                        </button>
                    </div>

                    {lines.map((line) => (
                        <div key={line.tempId} className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded">
                            <div className="col-span-5">
                                <label className="text-xs text-slate-500 mb-1 block">Produto</label>
                                <select
                                    className="w-full text-sm border-slate-300 rounded"
                                    value={line.item_id}
                                    onChange={e => updateLine(line.tempId, 'item_id', e.target.value)}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-slate-500 mb-1 block">Qtd</label>
                                <input
                                    type="number"
                                    className="w-full text-sm border-slate-300 rounded"
                                    value={line.qty}
                                    onChange={e => updateLine(line.tempId, 'qty', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-span-3">
                                <label className="text-xs text-slate-500 mb-1 block">Preço Un.</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full text-sm border-slate-300 rounded"
                                    value={line.unit_price}
                                    onChange={e => updateLine(line.tempId, 'unit_price', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-span-2 flex justify-end">
                                <button type="button" onClick={() => removeLine(line.tempId)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end items-center gap-4 border-t border-slate-100 pt-4">
                    <span className="text-lg font-bold text-slate-800">Total: R$ {total.toFixed(2)}</span>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center font-medium disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Finalizar Venda
                    </button>
                </div>
                {error && <p className="mt-2 text-sm text-red-500 text-right">{error}</p>}
            </div>
        </form>
    );
}
