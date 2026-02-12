'use client';

import { usePathname } from 'next/navigation';

export function Header() {
    const pathname = usePathname();

    // Simple breadcrumb logic
    const segments = pathname.split('/').filter(Boolean);
    const title = segments.length === 0 ? 'Dashboard' : segments[segments.length - 1];
    const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);

    return (
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <h1 className="text-xl font-semibold text-slate-800">{formattedTitle}</h1>
            <div className="flex items-center space-x-4">
                <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                    U
                </div>
            </div>
        </header>
    );
}
