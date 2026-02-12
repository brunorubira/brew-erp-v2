'use client';

import { useState } from 'react';
import { createBatch } from '@/app/actions/production';
import { Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type RecipeOption = {
    id: string;
    name: string;
    style: string | null;
    versionId: string | undefined;
    targetVolume: number | undefined;
};

export function NewBatchForm({ recipes }: { recipes: RecipeOption[] }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');

    const selectedRecipe = recipes.find(r => r.versionId === selectedRecipeId);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(event.currentTarget);

        try {
            const res = await createBatch(formData);
            if (!res.success) {
                throw new Error(res.error);
            }
            // Redirect handled in action via revalidatePath? 
            // Server actions redirect usually works if return type is void or handled, but here we return object.
            // We should check success and redirect manually or let the action redirect.
            // My action returns { success: boolean, batchId ... }.
            // So I will redirect here.
            router.push(`/production/${res.batchId}`);
        } catch (err: any) {
            setError(err.message);
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nome do Lote</label>
                <input
                    name="name"
                    required
                    className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-amber-500 text-sm"
                    placeholder="Ex: IPA #42"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Receita (Opcional)</label>
                <select
                    name="recipe_version_id"
                    className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-amber-500 text-sm"
                    value={selectedRecipeId}
                    onChange={(e) => setSelectedRecipeId(e.target.value)}
                >
                    <option value="">Sem Receita / Manual</option>
                    {recipes.map((r) => (
                        <option key={r.id} value={r.versionId || ''}>
                            {r.name} ({r.style}) - {r.targetVolume}L
                        </option>
                    ))}
                </select>
                <p className="text-xs text-slate-500">Selecionar uma receita preenche o volume sugerido.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Volume Planejado (L)</label>
                    <input
                        name="planned_volume_l"
                        type="number"
                        required
                        className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-amber-500 text-sm"
                        defaultValue={selectedRecipe ? selectedRecipe.targetVolume : 500}
                        key={selectedRecipe ? selectedRecipe.targetVolume : 'custom'} // Reset when recipe changes
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Data de Início</label>
                    <input
                        name="start_date"
                        type="date"
                        required
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="w-full h-10 px-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                </div>
            </div>

            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-6 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 font-medium disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Criar Lote
                </button>
            </div>
        </form>
    );
}
