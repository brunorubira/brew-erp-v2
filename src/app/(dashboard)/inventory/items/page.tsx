'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, Package, Tag, Layers, Beaker, X, Save, Loader2, Search } from 'lucide-react';
import { createItem, deleteItem, updateItem } from '@/app/actions/items';

export default function ItemCatalogPage() {
    const [items, setItems] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    const supabase = createClient();

    const fetchItems = async () => {
        const { data } = await supabase
            .from('items')
            .select('*')
            .eq('is_active', true)
            .order('name');
        if (data) setItems(data);
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja desativar o item "${name}"?`)) return;
        setIsPending(true);
        const res = await deleteItem(id);
        if (!res.success) alert(res.message);
        else fetchItems();
        setIsPending(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        const formData = new FormData(e.currentTarget);

        let res;
        if (editingItem) {
            res = await updateItem(editingItem.id, formData);
        } else {
            res = await createItem(formData);
        }

        if (!res.success) alert(res.message);
        else {
            setIsAdding(false);
            setEditingItem(null);
            fetchItems();
        }
        setIsPending(false);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setIsAdding(true);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingItem(null);
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || item.type === filterType;
        return matchesSearch && matchesType;
    });

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'ingredient': return <Beaker className="h-4 w-4 text-blue-500" />;
            case 'packaging': return <Layers className="h-4 w-4 text-purple-500" />;
            case 'product': return <Package className="h-4 w-4 text-amber-500" />;
            default: return <Tag className="h-4 w-4 text-slate-500" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'ingredient': return 'Insumo';
            case 'packaging': return 'Embalagem';
            case 'product': return 'Produto Final';
            default: return type;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800">Catálogo de Itens</h2>
                    <p className="text-slate-500">Defina os insumos e produtos que sua cervejaria utiliza.</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors text-sm font-medium"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Novo Item
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-lg border border-amber-200 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">{editingItem ? `Editar Item: ${editingItem.name}` : 'Cadastrar Novo Item'}</h3>
                        <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Item *</label>
                            <input name="name" required defaultValue={editingItem?.name} className="w-full border p-2 rounded-md border-slate-300 focus:outline-amber-500" placeholder="Ex: Malte Pilsen, Lata 473ml, IPA v1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
                            <select name="type" required defaultValue={editingItem?.type || 'ingredient'} className="w-full border p-2 rounded-md border-slate-300 focus:outline-amber-500">
                                <option value="ingredient">Insumo / Ingrediente</option>
                                <option value="packaging">Embalagem / Material</option>
                                <option value="product">Produto Final (Lata/Barril/etc)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unidade de Medida *</label>
                            <select name="unit" required defaultValue={editingItem?.unit || 'kg'} className="w-full border p-2 rounded-md border-slate-300 focus:outline-amber-500">
                                <option value="kg">Quilogramas (kg)</option>
                                <option value="g">Gramas (g)</option>
                                <option value="L">Litros (L)</option>
                                <option value="ml">Mililitros (ml)</option>
                                <option value="un">Unidade (un)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria Insumo (opcional)</label>
                            <select name="ingredient_category" defaultValue={editingItem?.ingredient_category || ''} className="w-full border p-2 rounded-md border-slate-300 focus:outline-amber-500">
                                <option value="">Nenhum</option>
                                <option value="malt">Malte</option>
                                <option value="hops">Lúpulo</option>
                                <option value="yeast">Levedura</option>
                                <option value="adjunct">Adjunto</option>
                                <option value="chemical">Químico / Limpeza</option>
                                <option value="other">Outro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria Embalagem (opcional)</label>
                            <select name="packaging_category" defaultValue={editingItem?.packaging_category || ''} className="w-full border p-2 rounded-md border-slate-300 focus:outline-amber-500">
                                <option value="">Nenhum</option>
                                <option value="can_body">Corpo de Lata</option>
                                <option value="can_lid">Tampa</option>
                                <option value="label">Rótulo</option>
                                <option value="box">Caixa / Embalagem</option>
                                <option value="other">Outro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Cód. Interno</label>
                            <input name="sku" defaultValue={editingItem?.sku || ''} className="w-full border p-2 rounded-md border-slate-300 focus:outline-amber-500" placeholder="Ex: MAT-001" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Volume (ml) - Apenas Produtos</label>
                            <input
                                name="volume_ml"
                                type="number"
                                defaultValue={editingItem?.volume_ml || 473}
                                className="w-full border p-2 rounded-md border-slate-300 focus:outline-amber-500 disabled:bg-slate-50 disabled:text-slate-400"
                                placeholder="Ex: 473, 1000, 30000"
                            />
                        </div>

                        <div className="lg:col-span-3 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-300 rounded-md">Cancelar</button>
                            <button type="submit" disabled={isPending} className="flex items-center px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm font-bold disabled:opacity-50">
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {editingItem ? 'Salvar Alterações' : 'Salvar Item'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou SKU..."
                            className="w-full pl-10 pr-4 py-2 border rounded-md border-slate-200 text-sm focus:outline-amber-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="border rounded-md border-slate-200 px-3 py-2 text-sm focus:outline-amber-500 bg-white"
                        >
                            <option value="all">Todos os tipos</option>
                            <option value="ingredient">Insumos</option>
                            <option value="packaging">Embalagens</option>
                            <option value="product">Produtos</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-slate-700">Item</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-700">Tipo</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-700">Categoria / Volume</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-700">Unidade</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-700">SKU</th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-700"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                                        Nenhum item encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(item.type)}
                                                <span className="text-slate-600">{getTypeLabel(item.type)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 uppercase text-[10px] font-mono">
                                            {item.type === 'product' ? `${item.volume_ml >= 1000 ? `${item.volume_ml / 1000}L` : `${item.volume_ml}ml`}` : (item.ingredient_category || item.packaging_category || '-')}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{item.unit}</td>
                                        <td className="px-6 py-4 font-mono text-slate-500">{item.sku || '-'}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="text-slate-300 hover:text-amber-500 transition-colors p-2"
                                                title="Editar Item"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id, item.name)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                                title="Desativar Item"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
