import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';

const PayrollPage = () => {
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayrollData = async () => {
      try {
        setLoading(true);
        const response = await api.request('/api/payroll'); // Assuming /api/payroll is the endpoint
        setPayrollData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payroll</h1>
          <p className="text-muted-foreground">Manage payroll</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add New</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Payroll Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading payroll data...</p>}
          {error && <p className="text-red-500">Error: {error.message}</p>}
          {payrollData && (
            <div>
              {/* Display fetched payroll data here */}
              <p className="text-muted-foreground">Payroll data loaded successfully!</p>
              <pre>{JSON.stringify(payrollData, null, 2)}</pre>
            </div>
          )}
          {!loading && !error && !payrollData && (
            <p className="text-muted-foreground">
              No payroll data available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollPage;