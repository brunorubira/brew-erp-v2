'use client';

import { useState } from 'react';
import { login, signup } from '@/app/actions/auth';
import { Beer, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'login' | 'signup'>('login');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const res = mode === 'login' ? await login(formData) : await signup(formData);

        if (res?.error) {
            setError(res.error);
            setIsPending(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                <div className="text-center">
                    <div className="flex justify-center">
                        <Beer className="h-12 w-12 text-amber-500" />
                    </div>
                    <h2 className="mt-4 text-3xl font-extrabold text-slate-900">
                        {mode === 'login' ? 'BrewERP Login' : 'Criar Conta BrewERP'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        {mode === 'login'
                            ? 'Acesse sua conta para gerenciar sua cervejaria'
                            : 'Registre-se para começar a gerenciar sua produção'}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                                placeholder="cervejeiro@exemplo.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                Senha
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="group relative flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:opacity-50 transition-colors"
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'login' ? 'Entrar' : 'Cadastrar'}
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                            className="text-sm font-medium text-amber-600 hover:text-amber-500"
                        >
                            {mode === 'login'
                                ? 'Não tem uma conta? Cadastre-se'
                                : 'Já tem uma conta? Entre aqui'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
