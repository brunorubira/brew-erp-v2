'use client';

import { useState } from 'react';
import { Database } from '@/lib/types';
import { Settings, Droplet, CheckCircle, AlertTriangle, Trash2, Plus, X, Save, Loader2, Edit2 } from 'lucide-react';
import { createVessel, deleteVessel, updateVessel } from '@/app/actions/vessels';

type Vessel = Database['public']['Tables']['vessels']['Row'];

export function TankList({ tanks }: { tanks: Vessel[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingTank, setEditingTank] = useState<Vessel | null>(null);
    const [isPending, setIsPending] = useState(false);

    const getStatusConfig = (status: string | null) => {
        switch (status) {
            case 'available': return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Disponível' };
            case 'occupied': return { color: 'bg-blue-100 text-blue-700', icon: Droplet, label: 'Ocupado' };
            case 'cip_needed': return { color: 'bg-amber-100 text-amber-700', icon: AlertTriangle, label: 'CIP Necessário' };
            case 'maintenance': return { color: 'bg-red-100 text-red-700', icon: Settings, label: 'Manutenção' };
            default: return { color: 'bg-slate-100 text-slate-500', icon: CheckCircle, label: status };
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o tanque "${name}"?`)) return;
        setIsPending(true);
        const res = await deleteVessel(id);
        if (!res.success) alert(res.message);
        setIsPending(false);
    };

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        const formData = new FormData(e.currentTarget);
        const res = await createVessel(formData);
        if (!res.success) alert(res.message);
        else setIsAdding(false);
        setIsPending(false);
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingTank) return;
        setIsPending(true);
        const formData = new FormData(e.currentTarget);
        const res = await updateVessel(editingTank.id, formData);
        if (!res.success) alert(res.message);
        else setEditingTank(null);
        setIsPending(false);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tanks.map((tank) => {
                const { color, icon: Icon, label } = getStatusConfig(tank.status);

                return (
                    <div key={tank.id} className="bg-white p-4 rounded-lg border-2 border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px] relative overflow-hidden group hover:border-amber-400 transition-all">
                        {editingTank?.id === tank.id ? (
                            <form onSubmit={handleUpdate} className="absolute inset-0 bg-white p-4 z-20 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-amber-700 uppercase">Editar Tanque</span>
                                    <button type="button" onClick={() => setEditingTank(null)} className="text-slate-400 hover:text-slate-600">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <input
                                    name="name"
                                    defaultValue={tank.name}
                                    className="text-xs p-1.5 border-2 rounded w-full border-slate-200 focus:border-amber-500 focus:outline-none"
                                    required
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <select name="type" defaultValue={tank.type} className="text-[10px] p-1.5 border-2 rounded flex-1 border-slate-200 focus:border-amber-500 focus:outline-none" required>
                                        <option value="fermenter">Fermentador</option>
                                        <option value="brite_tank">Maturador/Brite</option>
                                        <option value="mash_tun">Tina de Mosto</option>
                                        <option value="kettle">Fervura</option>
                                        <option value="other">Outro</option>
                                    </select>
                                    <input
                                        name="capacity_l"
                                        type="number"
                                        defaultValue={tank.capacity_l}
                                        className="text-[10px] p-1.5 border-2 rounded w-16 border-slate-200 focus:border-amber-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="mt-1 bg-amber-600 text-white text-xs py-2 rounded hover:bg-amber-700 flex items-center justify-center gap-2 font-bold shadow-sm"
                                >
                                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                    Salvar
                                </button>
                            </form>
                        ) : (
                            <>
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Icon className="h-16 w-16" />
                                </div>

                                <div className="flex justify-between items-start z-10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xl text-slate-900">{tank.name}</span>
                                            {tank.status === 'occupied' && (
                                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Em Uso</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-500 uppercase font-semibold">{tank.type.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingTank(tank)}
                                            className="text-slate-400 hover:text-amber-600 transition-colors p-1.5 border border-slate-100 rounded bg-slate-50"
                                            title="Editar Tanque"
                                            disabled={isPending}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tank.id, tank.name)}
                                            className="text-slate-400 hover:text-red-600 transition-colors p-1.5 border border-slate-100 rounded bg-slate-50"
                                            title="Excluir Tanque"
                                            disabled={tank.status === 'occupied' || isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="z-10 mt-auto pt-2">
                                    {tank.status === 'occupied' ? (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-end">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${color}`}>
                                                    {label}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-600 uppercase">Cap: {tank.capacity_l}L</span>
                                            </div>

                                            {(() => {
                                                const activeAssignment = (tank as any).assignments?.find((a: any) => !a.released_at);
                                                if (activeAssignment) {
                                                    const batchVolume = activeAssignment.batch.actual_volume_l ?? activeAssignment.batch.planned_volume_l ?? 0;
                                                    const usagePct = Math.min(100, Math.round((batchVolume / (Number(tank.capacity_l) || 1)) * 100));

                                                    return (
                                                        <div className="bg-blue-50 p-2 rounded border border-blue-100 mt-2">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <div className="text-[9px] font-black text-blue-400 tracking-widest uppercase">PRODUÇÃO ATIVA</div>
                                                                <div className="text-[10px] font-black text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                                                                    {batchVolume}L / {usagePct}%
                                                                </div>
                                                            </div>
                                                            <div className="text-xs font-black text-blue-900 truncate">
                                                                {activeAssignment.batch.name}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-blue-700 mt-0.5">
                                                                #{activeAssignment.batch.batch_number}
                                                            </div>
                                                            <div className="h-1 bg-blue-200 rounded-full overflow-hidden mt-2">
                                                                <div
                                                                    className="h-full bg-blue-600 transition-all duration-500"
                                                                    style={{ width: `${usagePct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 mt-2">
                                                        <div
                                                            className="h-full bg-blue-500 transition-all duration-500"
                                                            style={{ width: '0%' }}
                                                        ></div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${color} flex items-center gap-1`}>
                                                <Icon className="h-3 w-3" /> {label}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">{tank.capacity_l}L Cap.</span>
                                        </div>
                                    )}
                                </div>

                                {tank.status === 'occupied' && (
                                    <div className="absolute top-0 left-0 w-1 bg-blue-500 h-full"></div>
                                )}
                            </>
                        )}
                    </div>
                );
            })}

            {isAdding ? (
                <form onSubmit={handleAdd} className="bg-white p-4 rounded-lg border border-amber-300 shadow-md flex flex-col gap-2 h-36 z-20">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-amber-700 uppercase">Novo Tanque</span>
                        <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <input
                        name="name"
                        placeholder="Nome (ex: F01)"
                        className="text-xs p-1 border rounded w-full border-slate-200 focus:outline-amber-500"
                        required
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <select name="type" className="text-[10px] p-1 border rounded flex-1 border-slate-200" required>
                            <option value="fermenter">Fermentador</option>
                            <option value="brite_tank">Maturador/Brite</option>
                            <option value="mash_tun">Tina de Mosto</option>
                            <option value="kettle">Fervura</option>
                            <option value="other">Outro</option>
                        </select>
                        <input
                            name="capacity_l"
                            type="number"
                            placeholder="Litros"
                            className="text-[10px] p-1 border rounded w-16 border-slate-200"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="mt-1 bg-amber-500 text-white text-xs py-1.5 rounded hover:bg-amber-600 flex items-center justify-center gap-2 font-medium"
                    >
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Salvar
                    </button>
                </form>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="border-2 border-dashed border-slate-200 rounded-lg h-36 flex flex-col items-center justify-center text-slate-400 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-all group"
                >
                    <Plus className="h-8 w-8 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Adicionar Tanque</span>
                </button>
            )}
        </div>
    );
}
