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

export function VesselAssignmentForm({ batchId, vessels }: { batchId: string, vessels: any[] }) {
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
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-800 mb-2">Atribuir Tanque</h4>
            <div className="flex gap-2">
                <select name="vessel_id" className="flex-1 text-sm border-slate-300 rounded" required>
                    <option value="">Selecione...</option>
                    {vessels.map(v => (
                        <option key={v.id} value={v.id} disabled={v.status === 'occupied'}>
                            {v.name} ({v.capacity_l}L) {v.status === 'occupied' ? '(Ocupado)' : ''}
                        </option>
                    ))}
                </select>
                <button type="submit" disabled={isPending} className="px-3 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'OK'}
                </button>
            </div>
        </form>
    );
}
