
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Beaker, Thermometer, Activity, Package } from 'lucide-react';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { ConsumptionForm } from '@/components/modules/production/ConsumptionForm';
import { MeasurementsForm, VesselAssignmentForm } from '@/components/modules/production/BatchOperations';

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

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/production" className="text-slate-500 hover:text-slate-700">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-slate-800">{batch.name}</h2>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">{batch.batch_number}</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">
                        Status: <span className="capitalize font-medium text-slate-700">{batch.status.replace('_', ' ')}</span> |
                        Etapa: <span className="capitalize font-medium text-slate-700">{batch.stage}</span> |
                        Tanque: <span className="font-medium text-slate-700">{currentVessel}</span>
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Link
                        href={`/production/${batch.id}/packaging`}
                        className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 flex items-center text-sm font-medium"
                    >
                        <Package className="mr-2 h-4 w-4" /> Envasar (Packaging)
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Consumption Section */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4">Insumos Consumidos</h3>

                        {batch.consumptions && batch.consumptions.length > 0 ? (
                            <table className="w-full text-sm text-left mb-6">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-3 py-2">Item</th>
                                        <th className="px-3 py-2">Lote</th>
                                        <th className="px-3 py-2 text-right">Qtd</th>
                                        <th className="px-3 py-2 text-right">Data</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {batch.consumptions.map((c: any) => (
                                        <tr key={c.id}>
                                            <td className="px-3 py-2">{c.item?.name}</td>
                                            <td className="px-3 py-2 font-mono text-xs">{c.stock_lot?.supplier_lot_code}</td>
                                            <td className="px-3 py-2 text-right">{c.qty_consumed} {c.item?.unit}</td>
                                            <td className="px-3 py-2 text-right text-slate-400">{format(new Date(c.consumed_at), 'dd/MM HH:mm')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-slate-400 italic mb-6">Nenhum insumo registrado ainda.</p>
                        )}

                        <div className="border-t border-slate-100 pt-4">
                            <h4 className="text-sm font-medium text-slate-800 mb-3">Registrar Consumo Manual</h4>
                            <ConsumptionForm batchId={batch.id} lots={formattedLots} />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Measurements Card */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Medições</h3>
                        <MeasurementsForm batchId={batch.id} initialData={batch} />

                        {!batch.assignments?.[0] && (
                            <VesselAssignmentForm batchId={batch.id} vessels={vessels || []} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
