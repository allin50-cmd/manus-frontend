import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { TrendingUp, Plus } from 'lucide-react';

const SalesPage = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await api.get('/api/sales');
        setSalesData(response);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSalesData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground">Sales pipeline</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add New</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-muted-foreground">Loading sales data...</p>}
          {error && <p className="text-red-500">Error: {error.message}</p>}
          {!loading && !error && salesData.length > 0 && (
            <p className="text-muted-foreground">
              Sales pipeline data loaded. Total sales: {salesData.length}
            </p>
          )}
          {!loading && !error && salesData.length === 0 && (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No sales data found. Create your first sale to get started.
              </p>
              <Button><Plus className="mr-2 h-4 w-4" />Add Sale</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesPage;
