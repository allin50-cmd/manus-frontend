import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Plus, Edit, Trash } from 'lucide-react';

const APIDocumentationPage = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const data = await api.request('/api/agents');
        setEndpoints(data.map(agent => ({
          id: agent.id,
          name: `API Endpoint: ${agent.name}`,
          status: agent.status,
          created: agent.created || '2024-10-16',
          description: `Endpoint for ${agent.name} operations`
        })));
      } catch (error) {
        console.error('Failed to load API endpoints:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEndpoints();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground">API documentation and examples</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Create New</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading API endpoints...</p>
      ) : (
        <div className="grid gap-4">
          {endpoints.map(endpoint => (
            <Card key={endpoint.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Code className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">{endpoint.name}</h3>
                      <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                      <p className="text-xs text-muted-foreground">Created: {endpoint.created}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      endpoint.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {endpoint.status}
                    </span>
                    <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost"><Trash className="h-4 w-4" /></Button>
                  </div>
                </div>
                {!loading && !error && <div className="text-center py-4 text-muted-foreground">No data available.</div>}
        </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            API documentation and examples. Click "Create New" to get started.
          </p>
          <Button><Plus className="mr-2 h-4 w-4" />Create Your First Endpoint</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIDocumentationPage;

