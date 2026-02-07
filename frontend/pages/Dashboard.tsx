import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Zap, Youtube, Save, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const Dashboard: React.FC = () => {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [authUrl, setAuthUrl] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [showVerify, setShowVerify] = useState(false);

    // Mapping inputs
    const [newNiche, setNewNiche] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
        fetchAuthUrl();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/accounts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401 || res.status === 403) {
                navigate('/login');
                return;
            }
            const data = await res.json();
            setAccounts(data.accounts || []);
            setMappings(data.mappings || {});
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAuthUrl = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/youtube/auth-url`);
            const data = await res.json();
            setAuthUrl(data.url);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddAccount = async () => {
        if (!verifyCode) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/youtube/add-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: verifyCode })
            });
            if (res.ok) {
                setShowVerify(false);
                setVerifyCode('');
                fetchData();
                alert('Account Connected Successfully!');
            } else {
                alert('Failed to connect account');
            }
        } catch (err) {
            alert('Error connecting account');
        }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm('Are you sure you want to remove this account?')) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/accounts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddMapping = async () => {
        if (!newNiche || !selectedAccount) return;

        const updatedMappings = { ...mappings, [newNiche]: selectedAccount };
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BACKEND_URL}/api/admin/mappings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ mappings: updatedMappings })
            });
            if (res.ok) {
                setMappings(updatedMappings);
                setNewNiche('');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteMapping = async (niche: string) => {
        const updated = { ...mappings };
        delete updated[niche];
        const token = localStorage.getItem('adminToken');
        try {
            await fetch(`${BACKEND_URL}/api/admin/mappings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ mappings: updated })
            });
            setMappings(updated);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b0f19] text-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600/20 p-2 rounded-lg">
                            <Zap className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Director Mode</h1>
                            <p className="text-sm text-gray-500">Manage Channels & Automation Routing</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Back to Generator
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ACCOUNTS SECTION */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Youtube className="w-5 h-5 text-red-500" />
                                Connected Channels
                            </h2>
                            <button
                                onClick={() => setShowVerify(!showVerify)}
                                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" />
                                Connect New
                            </button>
                        </div>

                        {/* Add Account Form */}
                        {showVerify && (
                            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 mb-6 animate-in slide-in-from-top-2">
                                <p className="text-xs text-gray-400 mb-2">1. Authorize via Google:</p>
                                <a
                                    href={authUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block w-full text-center bg-gray-800 hover:bg-gray-700 py-2 rounded border border-gray-700 text-blue-400 text-sm mb-4"
                                >
                                    Open Authorization Link ↗
                                </a>
                                <p className="text-xs text-gray-400 mb-2">2. Paste the code you received:</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={verifyCode}
                                        onChange={e => setVerifyCode(e.target.value)}
                                        placeholder="4/0A..."
                                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-red-500 outline-none"
                                    />
                                    <button
                                        onClick={handleAddAccount}
                                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-medium"
                                    >
                                        Verify
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Accounts List */}
                        <div className="space-y-3">
                            {accounts.length === 0 ? (
                                <p className="text-center text-gray-500 py-8 text-sm">No accounts connected yet.</p>
                            ) : (
                                accounts.map(acc => (
                                    <div key={acc.id} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-800">
                                        <div className="flex items-center gap-3">
                                            {acc.picture ? (
                                                <img src={acc.picture} className="w-8 h-8 rounded-full" alt="" />
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-700 rounded-full" />
                                            )}
                                            <div>
                                                <h3 className="font-medium text-sm text-white">{acc.name}</h3>
                                                <p className="text-xs text-gray-500">{acc.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAccount(acc.id)}
                                            className="p-2 hover:bg-red-500/20 rounded-md group"
                                            title="Disconnect"
                                        >
                                            <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-red-400" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* MAPPINGS SECTION */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                Niche Routing
                            </h2>
                        </div>

                        <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 mb-6">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Add New Rule</h4>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <input
                                    type="text"
                                    value={newNiche}
                                    onChange={e => setNewNiche(e.target.value)}
                                    placeholder="Niche (e.g. Motivation)"
                                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm outline-none फोकस:border-yellow-500"
                                />
                                <select
                                    value={selectedAccount}
                                    onChange={e => setSelectedAccount(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm outline-none"
                                >
                                    <option value="">Select Channel...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleAddMapping}
                                disabled={!newNiche || !selectedAccount}
                                className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded text-sm font-medium border border-gray-700"
                            >
                                <Plus className="w-3 h-3 inline mr-2" />
                                Add Routing Rule
                            </button>
                        </div>

                        <div className="space-y-2">
                            {Object.entries(mappings).length === 0 ? (
                                <p className="text-center text-gray-500 py-4 text-sm">No routing rules active.</p>
                            ) : (
                                Object.entries(mappings).map(([niche, accId]) => {
                                    const account = accounts.find(a => a.id === accId);
                                    return (
                                        <div key={niche} className="flex items-center justify-between bg-gray-800/30 p-3 rounded-lg px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-mono text-yellow-500">{niche}</span>
                                                <span className="text-gray-600 text-xs">→</span>
                                                <span className="text-sm text-gray-300">{account ? account.name : 'Unknown Account'}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteMapping(niche)}
                                                className="text-gray-600 hover:text-red-400"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
