
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Beaker, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { TankList } from '@/components/modules/production/TankList';

export default async function ProductionPage() {
    const supabase = await createClient();

    // Parallel fetch: Batches + Tanks
    const [batchesRes, tanksRes] = await Promise.all([
        supabase
            .from('batches')
            .select(`
      id,
      batch_number,
      name,
      status,
      stage,
      planned_volume_l,
      actual_volume_l,
      start_date
    `)
            .order('created_at', { ascending: false }),

        supabase
            .from('vessels')
            .select('*')
            .eq('is_active', true)
            .order('name')
    ]);

    const batches = batchesRes.data;
    const tanks = tanksRes.data || [];

    if (batchesRes.error) {
        return <div>Erro ao carregar lotes.</div>;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'planned': return 'bg-blue-100 text-blue-700';
            case 'in_progress': return 'bg-amber-100 text-amber-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800">Lotes de Produção</h2>
                    <p className="text-slate-500">Gestão de brassagens, fermentação e envase.</p>
                </div>
                <Link
                    href="/production/new"
                    className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors text-sm font-medium"
                >
                    <Plus className="mr-2 h-4 w-4" /> Novo Lote
                </Link>
            </div>

            <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Tanques & Fermentadores</h3>
                <TankList tanks={tanks} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batches?.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        Nenhum lote encontrado. Inicie uma nova produção!
                    </div>
                ) : (
                    batches?.map((batch) => (
                        <Link key={batch.id} href={`/production/${batch.id}`} className="block group">
                            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">{batch.batch_number}</span>
                                        <h3 className="text-lg font-bold text-slate-800 mt-2 group-hover:text-amber-600 transition-colors">{batch.name}</h3>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(batch.status)}`}>
                                        {batch.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex items-center">
                                        <Beaker className="mr-2 h-4 w-4 text-slate-400" />
                                        <span>{batch.planned_volume_l} Litros (Planejado)</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="mr-2 h-4 w-4 text-slate-400" />
                                        <span>Início: {batch.start_date ? format(new Date(batch.start_date), 'dd/MM/yyyy') : '-'}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-slate-400" />
                                        <span className="capitalize">Etapa: {batch.stage}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
