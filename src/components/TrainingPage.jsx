import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { GraduationCap, Plus } from 'lucide-react';

const TrainingPage = () => {
  const [trainingMaterials, setTrainingMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrainingMaterials = async () => {
      try {
        setLoading(true);
        const response = await api.request('/training', 'GET'); // Assuming /training is the endpoint
        setTrainingMaterials(response);
      } catch (err) {
        setError('Failed to fetch training materials.');
        console.error('Error fetching training materials:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingMaterials();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Training</h1>
          <p className="text-muted-foreground">Access training materials</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add New</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Training Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading training materials...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && trainingMaterials.length === 0 && (
            <p className="text-muted-foreground">No training materials available.</p>
          )}
          {!loading && !error && trainingMaterials.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trainingMaterials.map((material) => (
                <Card key={material.id}>
                  <CardHeader>
                    <CardTitle>{material.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{material.description}</p>
                    {/* Add more details or a link to the material */}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingPage;
