'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Package, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

export function SalesListClient({ initialSales }: { initialSales: any[] }) {
    const [expandedSales, setExpandedSales] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        setExpandedSales(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden text-slate-800">
            <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 font-medium text-slate-600 text-sm">
                <div className="col-span-1"></div>
                <div className="col-span-2">Data</div>
                <div className="col-span-4">Cliente</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-3">Status</div>
            </div>

            <div className="divide-y divide-slate-100">
                {initialSales.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 italic">
                        Nenhuma venda registrada.
                    </div>
                ) : (
                    initialSales.map((sale) => {
                        const isExpanded = expandedSales[sale.id];
                        return (
                            <div key={sale.id} className="text-sm">
                                <div
                                    className={`grid grid-cols-12 gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors items-center ${isExpanded ? 'bg-slate-50' : ''}`}
                                    onClick={() => toggleExpand(sale.id)}
                                >
                                    <div className="col-span-1 flex justify-center">
                                        {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                    </div>
                                    <div className="col-span-2 text-slate-600">
                                        {sale.date ? format(new Date(sale.date), 'dd/MM/yyyy') : '-'}
                                    </div>
                                    <div className="col-span-4 font-medium text-slate-900">
                                        {sale.customer?.name || 'Venda Balcão'}
                                    </div>
                                    <div className="col-span-2 text-right font-bold text-slate-900">
                                        R$ {sale.total_amount?.toFixed(2)}
                                    </div>
                                    <div className="col-span-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${sale.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                sale.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {sale.status}
                                        </span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="bg-slate-50 px-4 pb-4 pl-14 border-t border-slate-100">
                                        <div className="py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Itens do Pedido</div>
                                        <table className="min-w-full text-xs text-slate-600">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="py-2 text-left">Produto</th>
                                                    <th className="py-2 text-right">Qtd</th>
                                                    <th className="py-2 text-right">Preço Un.</th>
                                                    <th className="py-2 text-right">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sale.items?.map((item: any) => (
                                                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                                                        <td className="py-2 flex items-center">
                                                            <Package className="h-3 w-3 mr-2 text-slate-400" />
                                                            {item.product?.name}
                                                        </td>
                                                        <td className="py-2 text-right font-mono">{item.qty}</td>
                                                        <td className="py-2 text-right">R$ {item.unit_price.toFixed(2)}</td>
                                                        <td className="py-2 text-right font-semibold">R$ {(item.qty * item.unit_price).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="border-t border-slate-200 font-bold">
                                                <tr>
                                                    <td colSpan={3} className="py-2 text-right uppercase text-[10px] text-slate-500">Total do Pedido</td>
                                                    <td className="py-2 text-right text-slate-900">R$ {sale.total_amount?.toFixed(2)}</td>
                                                </tr>
                                            </tfoot>
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
