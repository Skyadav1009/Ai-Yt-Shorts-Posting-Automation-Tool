import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Zap } from 'lucide-react';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
            const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                navigate('/dashboard');
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('Connection failed');
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8">
                <div className="flex justify-center mb-6">
                    <div className="bg-purple-900/30 p-3 rounded-full">
                        <Lock className="w-8 h-8 text-purple-400" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white text-center mb-6">Director Mode Login</h2>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Username</label>
                        <input
                            type="text"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition-colors"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none transition-colors"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-all">
                        Enter Dashboard
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a href="/" className="text-gray-500 hover:text-gray-300 text-sm flex items-center justify-center gap-1">
                        Go back to Generator
                    </a>
                </div>
            </div>
        </div>
    );
};
