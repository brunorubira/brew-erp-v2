'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Beer,
    LayoutDashboard,
    Package,
    Factory,
    ShoppingCart,
    Settings,
    LogOut,
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Estoque', href: '/inventory', icon: Package },
    { name: 'Cervejas Prontas', href: '/inventory/finished-products', icon: Beer },
    { name: 'Produção', href: '/production', icon: Factory },
    { name: 'Vendas', href: '/sales', icon: ShoppingCart },
    { name: 'Configurações', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
            <div className="flex h-16 items-center px-6 font-bold text-xl">
                <Beer className="mr-2 h-6 w-6 text-amber-500" />
                BrewERP
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'mr-3 h-5 w-5 flex-shrink-0',
                                    isActive ? 'text-amber-500' : 'text-slate-500 group-hover:text-amber-500'
                                )}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-slate-800 p-4">
                <button
                    className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    onClick={() => {
                        // Sign out logic here
                        alert('Logout clicked (logic pending)');
                    }}
                >
                    <LogOut className="mr-3 h-5 w-5 text-slate-500 group-hover:text-red-500" />
                    Sair
                </button>
            </div>
        </div>
    );
}
