import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Source {
    id: string;
    url: string;
    name: string;
    last_crawled_at: string;
}

export function SourcesManager() {
    const [sources, setSources] = useState<Source[]>([]);
    const [newSourceUrl, setNewSourceUrl] = useState('');
    const [newSourceName, setNewSourceName] = useState('');
    const [loading, setLoading] = useState(false);
    const [ingesting, setIngesting] = useState<Record<string,boolean>>({});
    

    useEffect(() => {
        fetchSources();
    }, []);

    const fetchSources = async () => {
        const { data, error } = await supabase.from('sources').select('*').order('name', { ascending: true});
        if (error) {
            console.error('Error fetching sources:', error);
        } else {
            setSources(data || []);
        }
    };

    const handleAddSource = async (e:React.FormEvent) => {
        e.preventDefault();
        if (!newSourceUrl || ! newSourceName) return;

        setLoading(true);

        //insert source into db
        const { data: newSource, error:insertError } = await supabase .from('sources') .insert({ url: newSourceUrl, name: newSourceName }) .select();

        setLoading(false);
        setNewSourceUrl('');
        setNewSourceName('');

        if (insertError){
            console.error('Error adding source:', insertError);
                if (insertError.code === '23505') {
                    alert('This RSS feed URL already exists')
                } return;
        }

        if (newSource && newSource.length > 0) {
            const sourceId = newSource[0].id;
            const url = newSource[0].url;
            setSources([...sources,newSource[0]]);

            triggerIngestion(sourceId,url);
        }

    };

    const triggerIngestion = async (sourceId: string, rssUrl:string) => {
        setIngesting(prev => ({ ...prev, [sourceId]: true}));

        try {
            const localAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const response = await fetch('http://127.0.0.1:54321/functions/v1/ingest-rss-feed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localAnonKey}`,
                },
                body: JSON.stringify({ url: rssUrl, sourceId: sourceId }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Ingestion failed:'. result);
                alert(`Ingestion failed: ${result.error || 'unknown error'}`);
            } else {
                console.log('Ingestion triggered successfully:', result);
                fetchSources();
            }
        } catch (error) {
            console.error('Error triggering ingestion:', error);
            alert('error trigering ingestion');
        } finally {
            setIngesting(prev => ({ ...prev, [sourceId]: false}));
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Manage RSS Sources</h1>

            {/* Form to Add New Source */}
            <form onSubmit={handleAddSource} className="mb-8 p-4 border rounded shadow">
                <h2 className="text-xl font-semibold mb-4">Add New Source</h2>
                <div className="mb-4">
                    <label htmlFor="sourceName" className="block text-sm font-medium text-gray-700">Source Name</label>
                    <input
                        type="text"
                        id="sourceName"
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700">RSS Feed URL</label>
                    <input
                        type="url"
                        id="sourceUrl"
                        value={newSourceUrl}
                        onChange={(e) => setNewSourceUrl(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                >
                    {loading ? 'Adding...' : 'Add Source'}
                </button>
            </form>

            {/* List of Existing Sources */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Existing Sources</h2>
                {sources.length === 0 ? (
                    <p>No sources added yet.</p>
                ) : (
                    <ul className="space-y-4">
                        {sources.map((source) => (
                            <li key={source.id} className="p-4 border rounded shadow flex justify-between items-center">
                                <div>
                                    <div className="font-medium">{source.name}</div>
                                    <div className="text-sm text-gray-600">{source.url}</div>
                                    <div className="text-xs text-gray-500">
                                        Last Crawled: {source.last_crawled_at ? new Date(source.last_crawled_at).toLocaleString() : 'Never'}
                                    </div>
                                </div>
                                {ingesting[source.id] ? (
                                    <span className="text-sm text-blue-600">Ingesting...</span>
                                ) : (
                                    <button
                                        onClick={() => triggerIngestion(source.id, source.url)}
                                        className="ml-4 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                                    >
                                        Ingest Now
                                    </button>
                                )}
                                {/* Add Delete/Edit buttons here if needed */}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );

    
}