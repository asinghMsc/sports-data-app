import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArticlesTable } from './ArticlesTable';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "./ui/card";
import { cn } from "../lib/utils";

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
  const [ingesting, setIngesting] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      console.error('Error fetching sources:', error);
    } else {
      setSources(data || []);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceUrl || !newSourceName) return;

    setLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setLoading(false);
      alert('You must be logged in to add a source.');
      return;
    }
    const userId = userData.user.id;

    console.log('Inserting new source for userId:', userId);
    const payload = { url: newSourceUrl, name: newSourceName, user_id: userId };
    console.log('Payload being sent to Supabase:', payload);

    const { data: newSource, error: insertError } = await supabase
      .from('sources')
      .insert(payload)
      .select();

    setLoading(false);
    setNewSourceUrl('');
    setNewSourceName('');

    if (insertError) {
      console.error('Error adding source:', insertError);
      if (insertError.code === '23505') {
        alert('This RSS feed URL already exists');
      }
      return;
    }

    if (newSource && newSource.length > 0) {
      const sourceId = newSource[0].id;
      const url = newSource[0].url;
      setSources([...sources, newSource[0]]);
      triggerIngestion(sourceId, url);
    }
  };

  const triggerIngestion = async (sourceId: string, rssUrl: string) => {
    setIngesting((prev) => ({ ...prev, [sourceId]: true }));

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert('You must be logged in to ingest.');
        return;
      }
      const accessToken = session.access_token;

      const response = await fetch('http://127.0.0.1:54321/functions/v1/ingest-rss-feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ url: rssUrl, sourceId }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Ingestion failed:', result);
        alert(`Ingestion failed: ${result.error || 'unknown error'}`);
      } else {
        console.log('Ingestion triggered successfully:', result);
        fetchSources();
      }
    } catch (error) {
      console.error('Error triggering ingestion:', error);
      alert('error triggering ingestion');
    } finally {
      setIngesting((prev) => ({ ...prev, [sourceId]: false }));
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Manage RSS Sources</CardTitle>
          <Button variant="destructive" onClick={() => navigate('/logout')}>Logout</Button>
        </CardHeader>
        <CardContent className="grid gap-6 px-6">
          {/* Add New Source Form */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Add New Source</h3>
            <form onSubmit={handleAddSource} className="grid gap-4">
              <div>
                <Label htmlFor="sourceName">Source Name</Label>
                <Input
                  id="sourceName"
                  type="text"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  required
                  className="w-full max-w-full"
                />
              </div>
              <div>
                <Label htmlFor="sourceUrl">RSS Feed URL</Label>
                <Input
                  id="sourceUrl"
                  type="url"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  required
                  className="w-full max-w-full"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Source'}
              </Button>
            </form>
          </div>

          {/* Existing Sources List */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Existing Sources</h3>
            {sources.length === 0 ? (
              <p className="text-muted-foreground">No sources added yet.</p>
            ) : (
              <ul className="space-y-4">
                {sources.map((source) => (
                  <li key={source.id} className="border rounded-lg p-4 flex justify-between items-center">
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
                      <Button variant="outline" size="sm" onClick={() => triggerIngestion(source.id, source.url)}>
                        Ingest Now
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Articles Table */}
          <div className="mt-6 w-full overflow-x-auto">
            <ArticlesTable />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}