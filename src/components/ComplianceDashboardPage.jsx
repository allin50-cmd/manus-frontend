import LoadingSpinner from './LoadingSpinner.jsx'
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { CheckCircle, Plus } from 'lucide-react';

const FineGuardDashboardPage = () => {
  const [fineguardData, setFineGuardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFineGuardData = async () => {
      try {
        const response = await api.get('/api/fineguard');
        setFineGuardData(response);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFineGuardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Fine Management Dashboard</h1>
        <LoadingSpinner text="Loading fine management data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Fine Management Dashboard</h1>
        <p className="text-red-500">Error loading fineguard data: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fine Management Dashboard</h1>
          <p className="text-muted-foreground">Monitor fineguard status</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add New</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Fine Management Dashboard Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fineguardData.length > 0 ? (
            <div>
              <p>FineGuard data loaded successfully. Displaying {fineguardData.length} items.</p>
              {/* Render your fineguard data here */}
              {/* Example: */}
              {/* <ul>
                {fineguardData.map(item => (
                  <li key={item.id}>{item.name}: {item.status}</li>
                ))}
              </ul> */}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No fineguard data available. Full functionality coming soon.
            </p>
          )}
          {!loading && !error && <div className="text-center py-4 text-muted-foreground">No data available.</div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default FineGuardDashboardPage;
