import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { CheckCircle, Plus } from 'lucide-react';

const ComplianceDashboardPage = () => {
  const [complianceData, setComplianceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComplianceData = async () => {
      try {
        const response = await api.get('/api/compliance');
        setComplianceData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplianceData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
        <p className="text-muted-foreground">Loading compliance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
        <p className="text-red-500">Error loading compliance data: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
          <p className="text-muted-foreground">Monitor compliance status</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add New</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Compliance Dashboard Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {complianceData.length > 0 ? (
            <div>
              <p>Compliance data loaded successfully. Displaying {complianceData.length} items.</p>
              {/* Render your compliance data here */}
              {/* Example: */}
              {/* <ul>
                {complianceData.map(item => (
                  <li key={item.id}>{item.name}: {item.status}</li>
                ))}
              </ul> */}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No compliance data available. Full functionality coming soon.
            </p>
          )}
          {!loading && !error && <div className="text-center py-4 text-muted-foreground">No data available.</div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceDashboardPage;
