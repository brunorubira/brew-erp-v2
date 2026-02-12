'use client';

import { useState } from 'react';
import { updateMeasurements, assignVessel } from '@/app/actions/production-details';
import { Save, Loader2 } from 'lucide-react';

export function MeasurementsForm({ batchId, initialData }: { batchId: string, initialData: any }) {
    const [isPending, setIsPending] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        const formData = new FormData(e.currentTarget);
        formData.append('batch_id', batchId);
        await updateMeasurements(formData);
        setIsPending(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <span className="text-sm text-slate-600">OG</span>
                <input name="measured_og" type="number" step="0.001" defaultValue={initialData.measured_og} className="w-20 text-right text-sm border-slate-200 rounded p-1" placeholder="1.050" />
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <span className="text-sm text-slate-600">FG</span>
                <input name="measured_fg" type="number" step="0.001" defaultValue={initialData.measured_fg} className="w-20 text-right text-sm border-slate-200 rounded p-1" placeholder="1.010" />
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">pH</span>
                <input name="measured_ph" type="number" step="0.1" defaultValue={initialData.measured_ph} className="w-20 text-right text-sm border-slate-200 rounded p-1" placeholder="5.2" />
            </div>
            <button type="submit" disabled={isPending} className="w-full mt-4 py-2 border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50 flex justify-center items-center">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Medições'}
            </button>
        </form>
    );
}

export function TransferToTankForm({ batchId, vessels, targetVolume }: { batchId: string, vessels: any[], targetVolume?: number }) {
    const [isPending, setIsPending] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        const formData = new FormData(e.currentTarget);
        formData.append('batch_id', batchId);
        await assignVessel(formData);
        setIsPending(false);
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t-2 border-slate-100 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                Transferir para Tanque
            </h4>

            <div className="space-y-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Selecionar Tanque</label>
                    <select name="vessel_id" className="w-full text-sm border-slate-200 rounded p-2 focus:border-amber-500 focus:outline-none bg-white font-bold" required>
                        <option value="">Selecione...</option>
                        {vessels.map(v => (
                            <option key={v.id} value={v.id} disabled={v.status === 'occupied'}>
                                {v.name} ({v.capacity_l}L) {v.status === 'occupied' ? '(Ocupado)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Volume Transferido (L)</label>
                    <input
                        name="actual_volume_l"
                        type="number"
                        step="0.1"
                        defaultValue={targetVolume}
                        className="w-full text-sm border-slate-200 rounded p-2 focus:border-amber-500 focus:outline-none font-black"
                        placeholder="Ex: 500"
                        required
                    />
                </div>

                <p className="text-[9px] text-slate-400 font-bold leading-tight">
                    * Ao transferir, o estágio do lote será alterado para <span className="text-blue-500 uppercase">Fermentação</span> automaticamente.
                </p>

                <button type="submit" disabled={isPending} className="w-full py-2.5 bg-slate-800 text-white rounded text-sm font-black hover:bg-slate-700 shadow-md flex justify-center items-center gap-2 transition-all active:scale-95">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Transferência'}
                </button>
            </div>
        </form>
    );
}
