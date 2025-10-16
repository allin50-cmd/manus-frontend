import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Webhook, Plus, Edit, Trash, Save, Loader2 } from 'lucide-react';

const WebhooksManagerPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.request('/api/webhooks');
      setItems(response);
    } catch (err) {
      console.error('Failed to fetch webhooks:', err);
      setError('Failed to load webhooks. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading webhooks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">WebhooksManager</h1>
          <p className="text-muted-foreground">Manage webhook endpoints</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Create New</Button>
      </div>

      <div className="grid gap-4">
        {items.length > 0 ? (
          items.map(item => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Webhook className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">Created: {item.created}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status}
                    </span>
                    <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost"><Trash className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Webhooks Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                It looks like you don't have any webhooks configured yet. Click "Create New" to get started.
              </p>
              <Button><Plus className="mr-2 h-4 w-4" />Create Your First Webhook</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {items.length === 0 && !loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Manage webhook endpoints. Click "Create New" to get started.
            </p>
            <Button><Plus className="mr-2 h-4 w-4" />Create Your First Item</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WebhooksManagerPage;