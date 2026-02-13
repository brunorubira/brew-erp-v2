
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Beaker, Calendar, CheckCircle2, Droplet } from 'lucide-react';
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
                start_date,
                assignments:batch_vessel_assignments(
                    assigned_at,
                    vessel:vessels(name)
                )
            `)
            .order('created_at', { ascending: false })
            .order('assigned_at', { foreignTable: 'batch_vessel_assignments', ascending: false }),

        supabase
            .from('vessels')
            .select(`
                *,
                assignments:batch_vessel_assignments(
                    released_at,
                    batch:batches(name, batch_number, actual_volume_l, planned_volume_l)
                )
            `)
            .eq('is_active', true)
            .order('name')
    ]);

    const batches = batchesRes.data;
    const tanks = tanksRes.data || [];

    if (batchesRes.error) {
        return <div>Erro ao carregar lotes.</div>;
    }

    const getStatusStyles = (status: string) => {
        const styles: any = {
            planned: 'bg-slate-100 text-slate-700 border-slate-200',
            in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
            completed: 'bg-green-100 text-green-700 border-green-200',
            cancelled: 'bg-red-100 text-red-700 border-red-200'
        };
        return styles[status] || styles.planned;
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Produção</h2>
                    <p className="text-slate-500 text-sm font-medium">Controle total de brassagens, fermentação e envase.</p>
                </div>
                <Link
                    href="/production/new"
                    className="flex items-center px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all text-sm font-black uppercase tracking-widest shadow-lg shadow-amber-200 active:scale-95"
                >
                    <Plus className="mr-2 h-5 w-5 stroke-[3px]" /> Novo Lote
                </Link>
            </div>

            <section className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-amber-100">
                <div className="flex items-center gap-2 mb-6">
                    <Beaker className="h-5 w-5 text-amber-500" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tanques & Fermentadores</h3>
                </div>
                <TankList tanks={tanks} />
            </section>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-amber-500 rounded-full"></div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Lotes em Andamento</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {batches?.length === 0 ? (
                        <div className="col-span-full text-center py-16 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Plus className="mx-auto h-8 w-8 mb-4 opacity-20" />
                            <p className="font-bold">Nenhum lote encontrado.</p>
                            <p className="text-xs">Inicie uma nova produção para começar o rastreamento.</p>
                        </div>
                    ) : (
                        batches?.map((batch) => (
                            <Link key={batch.id} href={`/production/${batch.id}`} className="group h-full">
                                <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm group-hover:border-amber-400 group-hover:shadow-xl group-hover:-translate-y-1 transition-all flex flex-col h-full relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[10px] font-black text-white bg-slate-800 px-2 py-0.5 rounded tracking-tighter uppercase">{batch.batch_number}</span>
                                            <h3 className="text-xl font-black text-slate-900 mt-2 tracking-tight group-hover:text-amber-600 transition-colors line-clamp-1">{batch.name}</h3>
                                            {(batch.assignments as any[])?.length > 0 && (
                                                <div className={`flex items-center mt-1 text-[10px] font-bold uppercase tracking-tight ${batch.status === 'completed' ? 'text-slate-500' : 'text-blue-600'}`}>
                                                    <span className={`${batch.status === 'completed' ? 'bg-slate-50 border-slate-100' : 'bg-blue-50 border-blue-100'} px-1.5 py-0.5 rounded border flex items-center`}>
                                                        <Droplet className="h-3 w-3 mr-1" />
                                                        {batch.status === 'completed' ? 'Produzido em: ' : ''}
                                                        {(batch.assignments as any[])[0].vessel.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-4">
                                        <div className="flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-tighter">
                                            <div className="flex items-center">
                                                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                                                <span>{batch.start_date ? format(new Date(batch.start_date), 'dd/MM/yy') : '-'}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <Beaker className="mr-1.5 h-3.5 w-3.5" />
                                                <span>{batch.planned_volume_l}L</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                                    <span>{batch.stage}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-700 ${batch.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`}
                                                        style={{ width: batch.status === 'completed' ? '100%' : '65%' }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 whitespace-nowrap shadow-sm ${getStatusStyles(batch.status)}`}>
                                                {batch.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {batch.status === 'in_progress' && (
                                        <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500 rotate-45 translate-x-4 -translate-y-4"></div>
                                    )}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
