'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { createPurchaseReceipt } from '@/app/actions/inventory';
import { useRouter } from 'next/navigation';

// Types passed from Server Component
type Supplier = { id: string; name: string };
type Item = { id: string; name: string; type: string; unit: string; ingredient_category: string | null };
type Location = { id: string; name: string };

const purchaseSchema = z.object({
    supplier_id: z.string().min(1, 'Fornecedor obrigatório'),
    invoice_number: z.string().optional(),
    date: z.string().min(1, 'Data obrigatória'),
    notes: z.string().optional(),
    items: z.array(
        z.object({
            item_id: z.string().min(1, 'Item obrigatório'),
            supplier_lot_code: z.string().min(1, 'Lote do fornecedor obrigatório'),
            location_id: z.string().min(1, 'Local obrigatório'),
            qty_received: z.number().min(0.001, 'Qtd deve ser positiva'),
            unit_cost: z.number().min(0, 'Custo não pode ser negativo'),
            expiry_date: z.string().optional().nullable(),
        })
    ).min(1, 'Adicione pelo menos um item'),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

export function PurchaseForm({
    suppliers,
    items,
    locations,
}: {
    suppliers: Supplier[];
    items: Item[];
    locations: Location[];
}) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<PurchaseFormData>({
        resolver: zodResolver(purchaseSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            items: [
                {
                    item_id: '',
                    supplier_lot_code: '',
                    location_id: locations.length > 0 ? locations[0].id : '',
                    qty_received: 0,
                    unit_cost: 0,
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    const watchItems = watch('items');

    // Check strict validation logic visually for Yeast
    const isYeast = (itemId: string) => {
        const item = items.find((i) => i.id === itemId);
        return item?.type === 'ingredient' && item?.ingredient_category === 'yeast';
    };

    const onSubmit = async (data: PurchaseFormData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await createPurchaseReceipt(data);
            if (!res.success) {
                throw new Error(res.error);
            }
            alert('Recebimento registrado com sucesso!');
            router.push('/inventory'); // Redirect to inventory list (to be created)
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Fornecedor</label>
                    <select
                        {...register('supplier_id')}
                        className="w-full h-10 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">Selecione...</option>
                        {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                    {errors.supplier_id && <p className="text-red-500 text-xs">{errors.supplier_id.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Número da NF</label>
                    <input
                        {...register('invoice_number')}
                        className="w-full h-10 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Ex: 12345"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Data de Recebimento</label>
                    <input
                        type="date"
                        {...register('date')}
                        className="w-full h-10 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-slate-800">Itens Recebidos</h3>
                    <button
                        type="button"
                        onClick={() => append({ item_id: '', supplier_lot_code: '', location_id: locations[0]?.id || '', qty_received: 0, unit_cost: 0 })}
                        className="flex items-center text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                        <Plus className="mr-1 h-4 w-4" /> Adicionar Item
                    </button>
                </div>

                {fields.map((field, index) => {
                    const currentItemId = watchItems[index]?.item_id;
                    const showExpiryWarning = isYeast(currentItemId);

                    return (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-slate-100 bg-slate-50 rounded-md">
                            <div className="md:col-span-3 space-y-1">
                                <label className="text-xs font-medium text-slate-500">Item</label>
                                <select
                                    {...register(`items.${index}.item_id`)}
                                    className="w-full h-9 px-2 rounded border border-slate-300 text-sm"
                                >
                                    <option value="">Selecione...</option>
                                    {items.map((i) => (
                                        <option key={i.id} value={i.id}>
                                            {i.name} ({i.unit})
                                        </option>
                                    ))}
                                </select>
                                {errors.items?.[index]?.item_id && <p className="text-red-500 text-xs">{errors.items[index]?.item_id?.message}</p>}
                            </div>

                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-medium text-slate-500">Lote Fornecedor</label>
                                <input
                                    {...register(`items.${index}.supplier_lot_code`)}
                                    className="w-full h-9 px-2 rounded border border-slate-300 text-sm"
                                    placeholder="Lote XYZ"
                                />
                                {errors.items?.[index]?.supplier_lot_code && <p className="text-red-500 text-xs">{errors.items[index]?.supplier_lot_code?.message}</p>}
                            </div>

                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-medium text-slate-500">
                                    Validade {showExpiryWarning && <span className="text-red-600 fw-bold">*</span>}
                                </label>
                                <input
                                    type="date"
                                    {...register(`items.${index}.expiry_date`)}
                                    className={`w-full h-9 px-2 rounded border text-sm ${showExpiryWarning ? 'border-amber-300 bg-amber-50' : 'border-slate-300'}`}
                                />
                            </div>

                            <div className="md:col-span-1 space-y-1">
                                <label className="text-xs font-medium text-slate-500">Qtd</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    {...register(`items.${index}.qty_received`, { valueAsNumber: true })}
                                    className="w-full h-9 px-2 rounded border border-slate-300 text-sm"
                                />
                                {errors.items?.[index]?.qty_received && <p className="text-red-500 text-xs">{errors.items[index]?.qty_received?.message}</p>}
                            </div>

                            <div className="md:col-span-1 space-y-1">
                                <label className="text-xs font-medium text-slate-500">Custo Un.</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register(`items.${index}.unit_cost`, { valueAsNumber: true })}
                                    className="w-full h-9 px-2 rounded border border-slate-300 text-sm"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-medium text-slate-500">Local</label>
                                <select
                                    {...register(`items.${index}.location_id`)}
                                    className="w-full h-9 px-2 rounded border border-slate-300 text-sm"
                                >
                                    {locations.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-1 flex items-end justify-center pb-1">
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                    title="Remover item"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {errors.items && <p className="text-red-500 text-sm">{errors.items.message}</p>}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                {error && <div className="text-red-600 bg-red-50 px-4 py-2 rounded-md">{error}</div>}
                <div className="flex-1"></div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-6 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" /> Registrar Recebimento
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
