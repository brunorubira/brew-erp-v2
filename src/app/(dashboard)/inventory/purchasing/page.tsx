
import { createClient } from '@/lib/supabase/server';
import { PurchaseForm } from '@/components/modules/inventory/PurchaseForm';

export default async function PurchasingPage() {
    const supabase = await createClient();

    // Parallel fetch for dependencies
    const [suppliersRes, itemsRes, locationsRes] = await Promise.all([
        supabase.from('entities').select('id, name').eq('type', 'supplier').eq('is_active', true),
        supabase.from('items').select('id, name, type, unit, ingredient_category').eq('is_active', true).neq('type', 'product'), // Products usually not purchased in bulk like items, or maybe they are? Re-reading req: "itens (ingredientes, embalagens, produtos)". Products are "finished goods" usually, but maybe resale? "Venda de produto acabado". "Produção por lote". So we purchase Ingredients and Packaging.
        // wait, "Itens (unificado) e regras: items with type... Product nao usa stock_lots, usa finished_lots."
        // So we CANNOT purchase 'product' via this flow (stock_lots), because stock_lots are for Ingredients/Packaging.
        // Confirmed: "Todo item pode ter estoque por lote (stock_lots) se for ingredient/packaging. Produto acabado não usa stock_lots".
        // So filter out products.
        supabase.from('inventory_locations').select('id, name').eq('is_active', true),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-800">Nova Compra / Recebimento</h2>
                <p className="text-slate-500">Registre a entrada de insumos e embalagens com rastreabilidade de lote.</p>
            </div>

            <PurchaseForm
                suppliers={suppliersRes.data || []}
                items={itemsRes.data || []}
                locations={locationsRes.data || []}
            />
        </div>
    );
}
