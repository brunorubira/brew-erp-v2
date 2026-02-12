
import { createClient } from '@/lib/supabase/server';
import { InventoryList } from '@/components/modules/inventory/InventoryList';
import Link from 'next/link';
import { Plus, Tag } from 'lucide-react';

export default async function InventoryPage() {
    const supabase = await createClient();

    // Fetch Items and their Active Stock Lots
    const { data: items, error: itemsError } = await supabase
        .from('items')
        .select(`
      id,
      name,
      type,
      unit,
      ingredient_category,
      packaging_category
    `)
        .eq('is_active', true)
        .in('type', ['ingredient', 'packaging']);

    const { data: lots, error: lotsError } = await supabase
        .from('stock_lots')
        .select(`
      id,
      item_id,
      location_id,
      supplier_lot_code,
      qty_on_hand,
      unit_cost,
      expiry_date,
      received_at,
      location:inventory_locations(name)
    `)
        .gt('qty_on_hand', 0)
        .eq('status', 'active');

    if (itemsError || lotsError) {
        console.error(itemsError, lotsError);
        return <div>Erro ao carregar estoque.</div>;
    }

    // Aggregate Data
    const inventoryItems = items.map(item => {
        const itemLots = lots?.filter(l => l.item_id === item.id) || [];
        const totalQty = itemLots.reduce((sum, lot) => sum + Number(lot.qty_on_hand), 0);

        // Fix location mapping manually
        const mappedLots = itemLots.map(l => {
            const locationName = Array.isArray(l.location)
                ? l.location[0]?.name
                : (l.location as any)?.name;

            return {
                ...l,
                location: { name: locationName || 'N/A' }
            };
        });

        return {
            id: item.id,
            name: item.name,
            type: item.type,
            unit: item.unit,
            category: item.ingredient_category || item.packaging_category,
            total_qty: totalQty,
            lots: mappedLots.sort((a, b) => {
                if (a.expiry_date && b.expiry_date) return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
                return new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
            })
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800">Estoque de Insumos</h2>
                    <p className="text-slate-500">Gestão de ingredientes, embalagens e lotes.</p>
                </div>
                <div className="flex space-x-3">
                    <Link
                        href="/inventory/items"
                        className="flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                        <Tag className="mr-2 h-4 w-4" /> Gerenciar Catálogo
                    </Link>
                    <Link
                        href="/inventory/purchasing"
                        className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors text-sm font-medium"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Receber Compra
                    </Link>
                </div>
            </div>

            <InventoryList items={inventoryItems} />
        </div>
    );
}
