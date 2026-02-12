'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Package, Calendar, Tag, BarChart3, Info } from 'lucide-react';
import { format } from 'date-fns';

type FinishedLot = {
    id: string;
    lot_code: string;
    qty_produced: number;
    qty_on_hand: number;
    unit_cost: number;
    best_before_date: string | null;
    created_at: string;
    batch: {
        batch_number: string;
        name: string;
    } | null;
};

type ProductStock = {
    id: string;
    name: string;
    unit: string;
    volume_ml: number | null;
    total_qty: number;
    lots: FinishedLot[];
};

export function FinishedProductsList({ products }: { products: ProductStock[] }) {
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border-2 border-slate-100 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b-2 border-slate-100 font-black text-slate-500 text-[10px] uppercase tracking-widest">
                <div className="col-span-1"></div>
                <div className="col-span-5">Produto / Lote</div>
                <div className="col-span-2 text-right">Volume Un.</div>
                <div className="col-span-2 text-right">Estoque</div>
                <div className="col-span-2 text-right">Valor Total</div>
            </div>

            <div className="divide-y divide-slate-100">
                {products.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium italic">Nenhum produto acabado em estoque.</p>
                    </div>
                ) : (
                    products.map((product) => {
                        const isExpanded = expandedItems[product.id];
                        const totalValue = product.lots.reduce((acc, lot) => acc + (lot.qty_on_hand * lot.unit_cost), 0);
                        const totalLiters = (product.total_qty * (product.volume_ml || 0)) / 1000;

                        return (
                            <div key={product.id} className="group transition-all">
                                <div
                                    className={`grid grid-cols-12 gap-4 p-4 hover:bg-slate-50 cursor-pointer items-center ${isExpanded ? 'bg-slate-50/50' : ''}`}
                                    onClick={() => toggleExpand(product.id)}
                                >
                                    <div className="col-span-1 flex justify-center">
                                        <div className={`p-1 rounded transition-colors ${isExpanded ? 'bg-amber-100 text-amber-600' : 'text-slate-300'}`}>
                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </div>
                                    </div>
                                    <div className="col-span-5 flex flex-col">
                                        <span className="font-black text-slate-800 tracking-tight uppercase">{product.name}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {product.lots.length} Lotes Diferentes
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-black text-slate-600 uppercase">
                                            {product.volume_ml} ML
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right flex flex-col items-end">
                                        <span className="font-black text-slate-800 text-lg leading-tight">
                                            {product.total_qty} <span className="text-xs text-slate-400 uppercase">{product.unit}</span>
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase">
                                            {totalLiters.toFixed(1)}L Total
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right font-black text-slate-600">
                                        <span className="text-[11px] text-slate-400 font-bold mr-1 italic">R$</span>
                                        {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="bg-slate-50 px-6 pb-6 pt-2">
                                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">Código do Lote</th>
                                                        <th className="px-4 py-2 text-left">Batida Origem</th>
                                                        <th className="px-4 py-2 text-center">Validade</th>
                                                        <th className="px-4 py-2 text-right">Estoque</th>
                                                        <th className="px-4 py-2 text-right">Custo Un.</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 capitalize font-medium text-slate-700">
                                                    {product.lots.map((lot) => {
                                                        const isExpired = lot.best_before_date && new Date(lot.best_before_date) < new Date();
                                                        return (
                                                            <tr key={lot.id} className="hover:bg-slate-50 transition-colors">
                                                                <td className="px-4 py-3 font-mono text-xs font-black text-blue-600 uppercase">{lot.lot_code}</td>
                                                                <td className="px-4 py-3 text-xs">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <BarChart3 className="h-3 w-3 text-slate-300" />
                                                                        <span>{lot.batch?.batch_number}</span>
                                                                        <span className="text-slate-400 font-normal italic">({lot.batch?.name})</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    {lot.best_before_date ? (
                                                                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${isExpired ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                                                            <Calendar className="h-3 w-3" />
                                                                            {format(new Date(lot.best_before_date), 'dd/MM/yyyy')}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-slate-300">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className="font-black text-slate-800">{lot.qty_on_hand}</span> <span className="text-[10px] text-slate-400 uppercase">{product.unit}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-xs font-black text-slate-500 italic">
                                                                    R$ {lot.unit_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
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
