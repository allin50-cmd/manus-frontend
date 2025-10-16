import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Edit, Trash } from 'lucide-react';

const CustomFieldsPage = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const data = await api.request('/api/companies');
        setFields(data.map(company => ({
          id: company.id,
          name: `Custom Field: ${company.name}`,
          status: 'active',
          created: '2024-10-16',
          type: 'text'
        })));
      } catch (error) {
        console.error('Failed to load custom fields:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFields();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Custom Fields</h1>
          <p className="text-muted-foreground">Create custom fields</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Create New</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading custom fields...</p>
      ) : (
        <div className="grid gap-4">
          {fields.map(field => (
            <Card key={field.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Settings className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">{field.name}</h3>
                      <p className="text-sm text-muted-foreground">Type: {field.type} • Created: {field.created}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      field.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {field.status}
                    </span>
                    <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost"><Trash className="h-4 w-4" /></Button>
                  </div>
                </div>
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
            Create custom fields. Click "Create New" to get started.
          </p>
          <Button><Plus className="mr-2 h-4 w-4" />Create Your First Field</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomFieldsPage;

