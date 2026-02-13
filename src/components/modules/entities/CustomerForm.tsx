'use client';

import { useState } from 'react';
import { createEntity, updateEntity } from '@/app/actions/entities';
import { Save, Loader2, X } from 'lucide-react';

interface CustomerFormProps {
    customer?: any;
    onSuccess?: (data?: any) => void;
    onCancel?: () => void;
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        formData.append('type', 'customer');

        const res = (customer
            ? await updateEntity(customer.id, formData)
            : await createEntity(formData)) as any;

        if (!res.success) {
            setError(res.message || 'Erro ao salvar cliente');
            setIsPending(false);
        } else {
            if (onSuccess) onSuccess(res.data);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm text-slate-800">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-slate-800">
                    {customer ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Nome <span className="text-red-500">*</span></label>
                    <input
                        name="name"
                        type="text"
                        defaultValue={customer?.name}
                        className="w-full mt-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">E-mail</label>
                    <input
                        name="email"
                        type="email"
                        defaultValue={customer?.email}
                        className="w-full mt-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Telefone</label>
                    <input
                        name="phone"
                        type="text"
                        defaultValue={customer?.phone}
                        className="w-full mt-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">CPF/CNPJ</label>
                    <input
                        name="tax_id"
                        type="text"
                        defaultValue={customer?.tax_id}
                        className="w-full mt-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Observações</label>
                    <textarea
                        name="notes"
                        defaultValue={customer?.notes}
                        rows={3}
                        className="w-full mt-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end gap-3 mt-6">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 flex items-center font-medium disabled:opacity-50 transition-colors shadow-sm"
                >
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {customer ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
            </div>
        </form>
    );
}
