'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, Package, Edit2, X, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { updateStockLot } from '@/app/actions/inventory';

type StockLot = {
    id: string;
    supplier_lot_code: string | null;
    qty_on_hand: number;
    unit_cost: number;
    expiry_date: string | null;
    received_at: string;
    location_id: string;
    location: { name: string } | null;
};

type InventoryItem = {
    id: string;
    name: string;
    type: string;
    unit: string;
    category: string | null;
    total_qty: number;
    lots: StockLot[];
};

export function InventoryList({ items }: { items: InventoryItem[] }) {
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    const [editingLot, setEditingLot] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const toggleExpand = (id: string) => {
        setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleUpdateLot = async (e: React.FormEvent<HTMLFormElement>, lotId: string) => {
        e.preventDefault();
        setIsPending(true);
        const formData = new FormData(e.currentTarget);
        const res = await updateStockLot(lotId, formData);
        if (!res.success) alert(res.message);
        else setEditingLot(null);
        setIsPending(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 font-medium text-slate-600 text-sm">
                <div className="col-span-4">Item</div>
                <div className="col-span-2">Categoria</div>
                <div className="col-span-2 text-right">Estoque Total</div>
                <div className="col-span-2 text-right">Valor Est.</div>
                <div className="col-span-2"></div>
            </div>

            <div className="divide-y divide-slate-100">
                {items.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        Nenhum item em estoque.
                    </div>
                ) : (
                    items.map((item) => {
                        const isExpanded = expandedItems[item.id];
                        const estimatedValue = item.lots.reduce((acc, lot) => acc + (lot.qty_on_hand * lot.unit_cost), 0);
                        const hasExpiredLots = item.lots.some(l => l.expiry_date && new Date(l.expiry_date) < new Date());

                        return (
                            <div key={item.id} className="text-sm">
                                <div
                                    className={`grid grid-cols-12 gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors items-center ${isExpanded ? 'bg-slate-50' : ''}`}
                                    onClick={() => toggleExpand(item.id)}
                                >
                                    <div className="col-span-4 flex items-center font-medium text-slate-800">
                                        <button className="mr-2 text-slate-400">
                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                        {item.name}
                                        <span title="Há lotes vencidos">
                                            <AlertCircle className="ml-2 h-4 w-4 text-red-500" />
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-slate-500 capitalize">
                                        {item.category || item.type}
                                    </div>
                                    <div className="col-span-2 text-right font-medium">
                                        {item.total_qty.toLocaleString('pt-BR')} {item.unit}
                                    </div>
                                    <div className="col-span-2 text-right text-slate-500">
                                        R$ {estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                            {item.lots.length} lotes
                                        </span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="bg-slate-50 px-4 pb-4 pl-10">
                                        <table className="w-full text-xs text-slate-600">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="py-2 text-left">Lote Fornecedor</th>
                                                    <th className="py-2 text-left">Local</th>
                                                    <th className="py-2 text-left">Validade</th>
                                                    <th className="py-2 text-right">Qtd</th>
                                                    <th className="py-2 text-right">Custo Un.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {item.lots.map((lot) => {
                                                    const isExpired = lot.expiry_date && new Date(lot.expiry_date) < new Date();
                                                    const isEditing = editingLot === lot.id;

                                                    if (isEditing) {
                                                        return (
                                                            <tr key={lot.id} className="border-b border-amber-100 bg-amber-50">
                                                                <td colSpan={5} className="py-2 px-1">
                                                                    <form onSubmit={(e) => handleUpdateLot(e, lot.id)} className="flex items-center gap-2">
                                                                        <div className="flex-1 flex gap-2">
                                                                            <input
                                                                                name="qty_on_hand"
                                                                                type="number"
                                                                                step="0.01"
                                                                                defaultValue={lot.qty_on_hand}
                                                                                className="w-20 p-1 border rounded text-[10px]"
                                                                                required
                                                                            />
                                                                            <input
                                                                                name="unit_cost"
                                                                                type="number"
                                                                                step="0.01"
                                                                                defaultValue={lot.unit_cost}
                                                                                className="w-20 p-1 border rounded text-[10px]"
                                                                                required
                                                                            />
                                                                            <input
                                                                                name="expiry_date"
                                                                                type="date"
                                                                                defaultValue={lot.expiry_date || ''}
                                                                                className="w-28 p-1 border rounded text-[10px]"
                                                                            />
                                                                            <input
                                                                                name="location_id"
                                                                                type="hidden"
                                                                                defaultValue={lot.location_id || ''}
                                                                            />
                                                                        </div>
                                                                        <div className="flex gap-1">
                                                                            <button type="submit" disabled={isPending} className="p-1 text-green-600 hover:text-green-800">
                                                                                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                                                            </button>
                                                                            <button type="button" onClick={() => setEditingLot(null)} className="p-1 text-slate-400 hover:text-slate-600">
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        </div>
                                                                    </form>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    return (
                                                        <tr key={lot.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-100 group">
                                                            <td className="py-2 font-mono flex items-center gap-2">
                                                                {lot.supplier_lot_code || '-'}
                                                                <button
                                                                    onClick={() => setEditingLot(lot.id)}
                                                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-amber-500 transition-all"
                                                                >
                                                                    <Edit2 className="h-3 w-3" />
                                                                </button>
                                                            </td>
                                                            <td className="py-2">{lot.location?.name || '-'}</td>
                                                            <td className={`py-2 ${isExpired ? 'text-red-600 font-bold' : ''}`}>
                                                                {lot.expiry_date ? format(new Date(lot.expiry_date), 'dd/MM/yyyy') : '-'}
                                                                {isExpired && ' (Vencido)'}
                                                            </td>
                                                            <td className="py-2 text-right">{lot.qty_on_hand} {item.unit}</td>
                                                            <td className="py-2 text-right">R$ {lot.unit_cost.toFixed(2)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
