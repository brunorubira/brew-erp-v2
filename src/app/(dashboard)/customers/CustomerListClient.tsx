'use client';

import { useState } from 'react';
import { Plus, Search, Mail, Phone, Edit2, Trash2 } from 'lucide-react';
import { CustomerForm } from '@/components/modules/entities/CustomerForm';
import { deleteEntity } from '@/app/actions/entities';

export function CustomerListClient({ initialCustomers }: { initialCustomers: any[] }) {
    const [customers, setCustomers] = useState(initialCustomers);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tax_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

        const res = await deleteEntity(id);
        if (res.success) {
            setCustomers(customers.filter(c => c.id !== id));
        } else {
            alert(res.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, e-mail ou documento..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {!showForm && !editingCustomer && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors font-medium"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                    </button>
                )}
            </div>

            {(showForm || editingCustomer) && (
                <div className="mb-6">
                    <CustomerForm
                        customer={editingCustomer}
                        onSuccess={(data) => {
                            if (editingCustomer) {
                                // In a real app we might want to refresh from server, but for now:
                                window.location.reload();
                            } else {
                                window.location.reload();
                            }
                            setShowForm(false);
                            setEditingCustomer(null);
                        }}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingCustomer(null);
                        }}
                    />
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden text-slate-800">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden text-slate-800">
                    {/* Desktop Table */}
                    <table className="hidden sm:table min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contato</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Documento</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500 italic">
                                        Nenhum cliente encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{customer.name}</div>
                                            {customer.notes && <div className="text-xs text-slate-500 truncate max-w-xs">{customer.notes}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col space-y-1">
                                                {customer.email && (
                                                    <div className="flex items-center text-sm text-slate-600">
                                                        <Mail className="h-3 w-3 mr-1" /> {customer.email}
                                                    </div>
                                                )}
                                                {customer.phone && (
                                                    <div className="flex items-center text-sm text-slate-600">
                                                        <Phone className="h-3 w-3 mr-1" /> {customer.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {customer.tax_id || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => setEditingCustomer(customer)}
                                                    className="text-amber-600 hover:text-amber-900 p-2"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="text-red-600 hover:text-red-900 p-2"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Mobile Card List */}
                    <div className="sm:hidden divide-y divide-slate-100">
                        {filteredCustomers.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 italic text-sm">
                                Nenhum cliente encontrado.
                            </div>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <div key={customer.id} className="p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-base font-bold text-slate-900">{customer.name}</div>
                                            {customer.tax_id && (
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    DOC: {customer.tax_id}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingCustomer(customer)}
                                                className="p-2 text-amber-600 hover:bg-amber-50 rounded"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        {customer.email && (
                                            <div className="flex items-center text-sm text-slate-600">
                                                <Mail className="h-3.5 w-3.5 mr-2 text-slate-400" /> {customer.email}
                                            </div>
                                        )}
                                        {customer.phone && (
                                            <div className="flex items-center text-sm text-slate-600">
                                                <Phone className="h-3.5 w-3.5 mr-2 text-slate-400" /> {customer.phone}
                                            </div>
                                        )}
                                    </div>

                                    {customer.notes && (
                                        <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                                            {customer.notes}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
