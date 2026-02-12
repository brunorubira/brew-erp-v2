
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Beaker, Thermometer, Activity, Package } from 'lucide-react';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ConsumptionForm, DeleteConsumptionButton } from '@/components/modules/production/ConsumptionForm';
import { MeasurementsForm, VesselAssignmentForm } from '@/components/modules/production/BatchOperations';
import { BatchEditForm } from '@/components/modules/production/BatchEditForm';

export default async function BatchDetailPage({ params }: { params: { id: string } }) {
    // Await params as per Next.js 15
    const { id } = await params;

    const supabase = await createClient();

    // Fetch Batch Details
    const { data: batch, error } = await supabase
        .from('batches')
        .select(`
      *,
      recipe_version:recipe_versions(
         recipe:recipes(name, style),
         target_volume_l
      ),
      assignments:batch_vessel_assignments(
         vessel:vessels(name)
      ),
      consumptions:batch_consumptions(
         id,
         qty_consumed,
         consumed_at,
         item:items(name, unit),
         stock_lot:stock_lots(supplier_lot_code)
      )
    `)
        .eq('id', id)
        .single();

    if (error || !batch) {
        notFound();
    }

    // Fetch Available Ingredients (Lots) for Consumption Form
    const { data: activelots } = await supabase
        .from('stock_lots')
        .select(`
        id,
        qty_on_hand,
        supplier_lot_code,
        expiry_date,
        item:items(id, name, unit, type)
    `)
        .gt('qty_on_hand', 0)
        .eq('status', 'active')
        .order('expiry_date', { ascending: true }); // FEFO Sort

    // Fetch Vessels for assignment
    const { data: vessels } = await supabase
        .from('vessels')
        .select('id, name, status, capacity_l')
        .eq('is_active', true)
        .order('name');

    // Format lots to match ConsumptionForm expected type (Supabase returns array for 1:1 join)
    const formattedLots = (activelots || []).map((lot: any) => ({
        ...lot,
        item: Array.isArray(lot.item) ? lot.item[0] : lot.item,
    }));

    const currentVessel = batch.assignments?.[0]?.vessel?.name || 'Não atribuído';

    const statusColors: any = {
        planned: 'bg-slate-100 text-slate-700 border-slate-200',
        in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
        completed: 'bg-green-100 text-green-700 border-green-200',
        cancelled: 'bg-red-100 text-red-700 border-red-200'
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/production" className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full border border-slate-200 shadow-sm transition-all">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{batch.name}</h2>
                        <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">{batch.batch_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-tight mt-1">
                        <span className={`px-2 py-0.5 rounded-full border-2 ${statusColors[batch.status] || statusColors.planned}`}>
                            {batch.status.replace('_', ' ')}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>Etapa: <span className="text-slate-700">{batch.stage}</span></span>
                        <span className="text-slate-300">|</span>
                        <span>Tanque: <span className="text-slate-700">{currentVessel}</span></span>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <BatchEditForm batch={batch} />
                    <Link
                        href={`/production/${batch.id}/packaging`}
                        className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 flex items-center text-sm font-bold shadow-md transition-all active:scale-95"
                    >
                        <Package className="mr-2 h-4 w-4" /> Envasar (Packaging)
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Consumption Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                <Beaker className="h-5 w-5 text-amber-500" />
                                Insumos Consumidos
                            </h3>
                        </div>

                        {batch.consumptions && batch.consumptions.length > 0 ? (
                            <div className="overflow-hidden rounded-lg border border-slate-100 mb-6">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3">Insumo</th>
                                            <th className="px-4 py-3">Lote Origem</th>
                                            <th className="px-4 py-3 text-right">Qtd</th>
                                            <th className="px-4 py-3 text-right">Data</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {batch.consumptions.map((c: any) => (
                                            <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-bold text-slate-700">{c.item?.name}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.stock_lot?.supplier_lot_code || 'N/A'}</td>
                                                <td className="px-4 py-3 text-right font-black text-slate-800">{c.qty_consumed} {c.item?.unit}</td>
                                                <td className="px-4 py-3 text-right text-slate-400 text-xs">{format(new Date(c.consumed_at), 'dd/MM HH:mm')}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <DeleteConsumptionButton id={c.id} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 mb-6">
                                <p className="text-slate-400 font-medium italic">Nenhum insumo registrado ainda.</p>
                            </div>
                        )}

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Registrar Consumo Manual</h4>
                            <ConsumptionForm batchId={batch.id} lots={formattedLots} />
                        </div>
                    </div>

                    {batch.notes && (
                        <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-100">
                            <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-3">Notas do Lote</h3>
                            <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{batch.notes}</p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Measurements Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-slate-100">
                        <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            Medições & Controle
                        </h3>
                        <MeasurementsForm batchId={batch.id} initialData={batch} />

                        {!batch.assignments?.[0] && (
                            <VesselAssignmentForm batchId={batch.id} vessels={vessels || []} />
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-slate-100">
                        <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-red-500" />
                            Próximos Passos
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            Mantenha o registro de densidade e pH atualizados para melhor previsibilidade do rendimento final.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
