'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, Package } from 'lucide-react';
import { format } from 'date-fns';

type StockLot = {
    id: string;
    supplier_lot_code: string | null;
    qty_on_hand: number;
    unit_cost: number;
    expiry_date: string | null;
    received_at: string;
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

    const toggleExpand = (id: string) => {
        setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
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
                                                    return (
                                                        <tr key={lot.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-100">
                                                            <td className="py-2 font-mono">{lot.supplier_lot_code || '-'}</td>
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
