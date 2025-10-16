
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
          {marketingData && marketingData.length > 0 ? (
            <div>
              <p>Data fetched successfully:</p>
              <pre>{JSON.stringify(marketingData, null, 2)}</pre>
            </div>
          ) : (
            <div className="text-center py-8">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No marketing campaigns found. Create your first campaign to get started.
              </p>
              <Button><Plus className="mr-2 h-4 w-4" />Create Campaign</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingPage;
