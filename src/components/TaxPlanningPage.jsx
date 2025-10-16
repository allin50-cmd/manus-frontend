import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { Calculator, Plus } from 'lucide-react';

const TaxPlanningPage = () => {
  const [taxPlans, setTaxPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTaxPlans = async () => {
      try {
        setLoading(true);
        const response = await api.request('/tax-plans'); // Assuming this is the endpoint
        setTaxPlans(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxPlans();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">TaxPlanning</h1>
        <p>Loading tax plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">TaxPlanning</h1>
        <p className="text-red-500">Error loading tax plans: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">TaxPlanning</h1>
          <p className="text-muted-foreground">Plan tax strategy</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add New</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            TaxPlanning Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {taxPlans.length > 0 ? (
            <ul>
              {taxPlans.map(plan => (
                <li key={plan.id}>{plan.name}</li> // Assuming plans have an 'id' and 'name'
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              No tax plans found. Full functionality coming soon.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxPlanningPage;
