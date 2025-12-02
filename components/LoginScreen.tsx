import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Logo } from './Logo';

interface LoginScreenProps {
    isSetup: boolean;
    onLogin: (pin: string) => void;
    error?: string;
}

export function LoginScreen({ isSetup, onLogin, error }: LoginScreenProps) {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSetup) {
            if (pin !== confirmPin) {
                alert("PINs do not match");
                return;
            }
        }
        onLogin(pin);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <Logo className="w-16 h-16 mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800">
                        {isSetup ? "Setup Security" : "Welcome Back"}
                    </h1>
                    <p className="text-slate-500 text-center mt-2">
                        {isSetup
                            ? "Create a PIN to encrypt your patient data. Don't lose this PIN!"
                            : "Enter your PIN to decrypt your data."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {isSetup ? "Create PIN" : "Enter PIN"}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                placeholder="••••"
                                required
                            />
                        </div>
                    </div>

                    {isSetup && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Confirm PIN
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="password"
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    placeholder="••••"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full py-3 mt-2">
                        {isSetup ? "Set PIN & Start" : "Unlock"} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
