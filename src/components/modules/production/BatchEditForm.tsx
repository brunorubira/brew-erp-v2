'use client';

import { useState } from 'react';
import { updateBatch } from '@/app/actions/production';
import { Save, X, Loader2, Edit2 } from 'lucide-react';

export function BatchEditForm({ batch }: { batch: any }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        const formData = new FormData(e.currentTarget);
        await updateBatch(batch.id, formData);
        setIsPending(false);
        setIsEditing(false);
    };

    if (!isEditing) {
        return (
            <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
                <Edit2 className="h-4 w-4" /> Editar Lote
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 uppercase tracking-tight">Editar Detalhes do Lote</h3>
                    <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Lote</label>
                        <input
                            name="name"
                            defaultValue={batch.name}
                            className="w-full p-2 border border-slate-200 rounded text-sm focus:border-amber-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                            <select
                                name="status"
                                defaultValue={batch.status}
                                className="w-full p-2 border border-slate-200 rounded text-sm focus:border-amber-500 focus:outline-none"
                            >
                                <option value="planned">Planejado</option>
                                <option value="in_progress">Em Produção</option>
                                <option value="completed">Concluído</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Etapa</label>
                            <select
                                name="stage"
                                defaultValue={batch.stage}
                                className="w-full p-2 border border-slate-200 rounded text-sm focus:border-amber-500 focus:outline-none"
                            >
                                <option value="planning">Planejamento</option>
                                <option value="mashing">Mostura</option>
                                <option value="boiling">Fervura</option>
                                <option value="fermenting">Fermentação</option>
                                <option value="conditioning">Maturação</option>
                                <option value="packaging">Envase</option>
                                <option value="finished">Finalizado</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Volume Atual (L)</label>
                            <input
                                name="actual_volume_l"
                                type="number"
                                step="0.1"
                                defaultValue={batch.actual_volume_l}
                                className="w-full p-2 border border-slate-200 rounded text-sm focus:border-amber-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Notas</label>
                        <textarea
                            name="notes"
                            defaultValue={batch.notes}
                            className="w-full p-2 border border-slate-200 rounded text-sm focus:border-amber-500 focus:outline-none min-h-[80px]"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex-1 py-2 border border-slate-200 rounded text-sm font-bold text-slate-600 hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 py-2 bg-amber-600 text-white rounded text-sm font-bold hover:bg-amber-700 shadow-md flex items-center justify-center gap-2"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
