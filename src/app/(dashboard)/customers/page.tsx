import { createClient } from '@/lib/supabase/server';
import { Plus, Users, Mail, Phone, FileText } from 'lucide-react';
import { CustomerListClient } from './CustomerListClient';

export default async function CustomersPage() {
    const supabase = await createClient();

    const { data: customers } = await supabase
        .from('entities')
        .select('*')
        .eq('type', 'customer')
        .eq('is_active', true)
        .order('name');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800">Clientes</h2>
                    <p className="text-slate-500">Gestão de contatos e clientes</p>
                </div>
            </div>

            <CustomerListClient initialCustomers={customers || []} />
        </div>
    );
}
