'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-full overflow-hidden relative">
            {/* Desktop Sidebar */}
            <Sidebar className="hidden lg:flex" />

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Sidebar
                className={cn(
                    "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:hidden",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
