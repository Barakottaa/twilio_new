'use client';

import React, { useState, useEffect } from 'react';

export default function SystemLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState('combined');

    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/system-logs?date=${date}&type=${type}`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);
            setLogs(data.logs || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [date, type]);

    return (
        <div className="container mx-auto py-6 px-4">
            <h1 className="text-2xl font-bold mb-6">System Logs</h1>

            <div className="flex gap-4 mb-6 items-center flex-wrap">
                <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border rounded p-2 bg-background"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="border rounded p-2 bg-background"
                    >
                        <option value="combined">All Logs</option>
                        <option value="error">Errors Only</option>
                    </select>
                </div>

                <button
                    onClick={fetchLogs}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 mt-6"
                >
                    Refresh
                </button>
            </div>

            {loading && <p>Loading logs...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}

            {!loading && !error && (
                <div className="border rounded-md overflow-hidden bg-muted/20">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground">
                            <tr>
                                <th className="p-2 border-b">Timestamp</th>
                                <th className="p-2 border-b">Service</th>
                                <th className="p-2 border-b">Level</th>
                                <th className="p-2 border-b">Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-muted-foreground">No logs found for this date.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="border-b hover:bg-muted/10">
                                        <td className="p-2 whitespace-nowrap text-xs text-muted-foreground font-mono">
                                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '-'}
                                        </td>
                                        <td className="p-2 font-medium">{log.service || '-'}</td>
                                        <td className={`p-2 font-bold ${log.level === 'error' ? 'text-red-500' :
                                                log.level === 'warn' ? 'text-yellow-500' : 'text-green-500'
                                            }`}>
                                            {log.level ? log.level.toUpperCase() : 'UNKNOWN'}
                                        </td>
                                        <td className="p-2 font-mono text-xs break-all">
                                            {log.message}
                                            {log.stack && (
                                                <div className="mt-1 text-red-400 whitespace-pre-wrap">
                                                    {log.stack}
                                                </div>
                                            )}
                                            {/* Show extra properties excluding known fields */}
                                            {Object.keys(log).filter(k => !['id', 'timestamp', 'service', 'level', 'message', 'stack'].includes(k)).length > 0 && (
                                                <details>
                                                    <summary className="cursor-pointer text-blue-500">Details</summary>
                                                    <pre className="text-[10px] mt-1 p-1 bg-black/5 rounded">
                                                        {JSON.stringify(
                                                            Object.fromEntries(Object.entries(log).filter(([k]) => !['id', 'timestamp', 'service', 'level', 'message', 'stack'].includes(k))),
                                                            null, 2
                                                        )}
                                                    </pre>
                                                </details>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
