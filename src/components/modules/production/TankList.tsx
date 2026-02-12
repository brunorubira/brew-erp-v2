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
                    <div key={tank.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
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
                                    className="text-xs p-1 border rounded w-full border-slate-200 focus:outline-amber-500"
                                    required
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <select name="type" defaultValue={tank.type} className="text-[10px] p-1 border rounded flex-1 border-slate-200" required>
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
                            <>
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Icon className="h-16 w-16" />
                                </div>

                                <div className="flex justify-between items-start z-10">
                                    <div>
                                        <span className="font-bold text-lg text-slate-800 block">{tank.name}</span>
                                        <span className="text-[10px] text-slate-500 uppercase">{tank.type.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingTank(tank)}
                                            className="text-slate-300 hover:text-amber-500 transition-colors p-1"
                                            title="Editar Tanque"
                                            disabled={isPending}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tank.id, tank.name)}
                                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                            title="Excluir Tanque"
                                            disabled={tank.status === 'occupied' || isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="z-10 mt-auto">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color} flex items-center gap-1`}>
                                            <Icon className="h-3 w-3" /> {label}
                                        </span>
                                        <span className="text-xs font-mono text-slate-400">{tank.capacity_l}L</span>
                                    </div>
                                </div>

                                {tank.status === 'occupied' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-amber-50 opacity-30 z-0 animate-pulse"></div>
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
