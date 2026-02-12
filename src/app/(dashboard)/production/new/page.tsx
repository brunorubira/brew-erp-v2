
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NewBatchForm } from '@/components/modules/production/NewBatchForm';

export default async function NewBatchPage() {
    const supabase = await createClient();

    // Fetch Active Recipes
    const { data: recipes } = await supabase
        .from('recipes')
        .select(`
      id,
      name,
      style,
      versions:recipe_versions(id, version_number, target_volume_l, is_current)
    `)
        .eq('is_active', true)

    // Filter for current versions manually if needed logic is complex, 
    // or trust the data structure. Supabase query above gets all versions.
    // We should filter in JS.

    const recipeOptions = recipes?.map(r => {
        const currentVersion = Array.isArray(r.versions)
            ? r.versions.find((v: any) => v.is_current)
            : null;

        if (!currentVersion) return null;

        return {
            id: r.id,
            name: r.name,
            style: r.style,
            versionId: currentVersion.id,
            targetVolume: currentVersion.target_volume_l
        };
    }).filter(Boolean) as any[] || [];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/production" className="text-slate-500 hover:text-slate-700">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h2 className="text-2xl font-bold text-slate-800">Novo Lote de Produção</h2>
            </div>

            <NewBatchForm recipes={recipeOptions} />
        </div>
    );
}
