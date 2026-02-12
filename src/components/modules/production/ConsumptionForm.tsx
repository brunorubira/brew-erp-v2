'use client';

import { useState } from 'react';
import { consumeIngredient } from '@/app/actions/production-details';
import { deleteConsumption } from '@/app/actions/production';
import { Loader2, Plus, Trash2 } from 'lucide-react';

type Lot = {
    id: string;
    qty_on_hand: number;
    supplier_lot_code: string | null;
    expiry_date: string | null;
    item: {
        id: string;
        name: string;
        unit: string;
        type: string;
    } | null;
};

export function DeleteConsumptionButton({ id }: { id: string }) {
    const [isPending, setIsPending] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Deseja realmente excluir este consumo? O estoque será devolvido ao lote original.')) return;
        setIsPending(true);
        await deleteConsumption(id);
        setIsPending(false);
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-slate-300 hover:text-red-600 transition-colors p-1"
            title="Excluir Consumo"
        >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
    );
}

export function ConsumptionForm({ batchId, lots }: { batchId: string, lots: Lot[] }) {
    const [selectedItemId, setSelectedItemId] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [message, setMessage] = useState('');

    // Group lots by Item
    const items = Array.from(new Set(lots.map(l => l.item?.id).filter(Boolean)));
    const itemOptions = items.map(id => {
        const lot = lots.find(l => l.item?.id === id);
        return { id, name: lot?.item?.name, unit: lot?.item?.unit };
    });

    const availableLots = lots.filter(l => l.item?.id === selectedItemId);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        setMessage('');

        const formData = new FormData(e.currentTarget);
        formData.append('batch_id', batchId);
        // Item ID is also needed to verify, though stock_lot implies it.
        formData.append('item_id', selectedItemId);

        const res = await consumeIngredient(null, formData);

        setIsPending(false);
        if (res?.message) {
            setMessage(res.message);
        }
        if (res?.success) {
            // Reset form?
            (e.target as HTMLFormElement).reset();
            setSelectedItemId('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-12 gap-3">
                <div className="col-span-4">
                    <select
                        className="w-full text-sm border-slate-300 rounded"
                        value={selectedItemId}
                        onChange={e => setSelectedItemId(e.target.value)}
                        required
                    >
                        <option value="">Item...</option>
                        {itemOptions.map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                    </select>
                </div>
                <div className="col-span-5">
                    <select name="stock_lot_id" className="w-full text-sm border-slate-300 rounded" required disabled={!selectedItemId}>
                        <option value="">Selecione Lote (FEFO)...</option>
                        {availableLots.map(lot => {
                            const isExpired = lot.expiry_date && new Date(lot.expiry_date) < new Date();
                            return (
                                <option key={lot.id} value={lot.id} disabled={!!isExpired} className={isExpired ? 'text-red-500' : ''}>
                                    {lot.expiry_date ? lot.expiry_date.slice(0, 10) : 'S/ Val'} - {lot.supplier_lot_code || 'S/ Lote'} ({lot.qty_on_hand})
                                    {isExpired ? ' (VENCIDO)' : ''}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div className="col-span-2">
                    <input name="qty_consumed" type="number" step="0.001" placeholder="Qtd" className="w-full text-sm border-slate-300 rounded" required />
                </div>
                <div className="col-span-1">
                    <button type="submit" disabled={isPending} className="p-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </button>
                </div>
            </div>
            {message && <p className="text-xs text-amber-600 font-medium">{message}</p>}
        </form>
    );
}
