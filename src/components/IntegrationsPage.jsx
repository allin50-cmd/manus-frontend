import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { Plug, Plus, Loader2 } from 'lucide-react';

const IntegrationsPage = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setLoading(true);
        const response = await api.request('/integrations'); // Assuming an endpoint for integrations
        setIntegrations(response.data);
      } catch (err) {
        setError('Failed to fetch integrations.');
        console.error('Error fetching integrations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading integrations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">Connect third-party services</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add New</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Integrations Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Connect third-party services. Full functionality coming soon.
          </p>
          {integrations.length > 0 ? (
            <ul className="mt-4">
              {integrations.map((integration) => (
                <li key={integration.id} className="py-2 border-b last:border-b-0">
                  {integration.name} - {integration.status}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-muted-foreground">No integrations found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsPage;
