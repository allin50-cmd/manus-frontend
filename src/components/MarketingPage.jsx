
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { Megaphone, Plus } from 'lucide-react';
import React, { useState, useEffect } from 'react'; // Added React, useState, useEffect

const MarketingPage = () => {
  const [marketingData, setMarketingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarketingData = async () => {
      try {
        setLoading(true);
        // Assuming an API endpoint for marketing data
        const response = await api.request('/api/marketing', { method: 'GET' });
        setMarketingData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketingData();
  }, []);

  if (loading) {
    return <div className="space-y-6">Loading marketing data...</div>;
  }

  if (error) {
    return <div className="space-y-6">Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Marketing</h1>
          <p className="text-muted-foreground">Marketing campaigns</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add New</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Marketing Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {marketingData ? (
            <div>
              <p>Data fetched successfully:</p>
              <pre>{JSON.stringify(marketingData, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No marketing data available. Full functionality coming soon.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingPage;
