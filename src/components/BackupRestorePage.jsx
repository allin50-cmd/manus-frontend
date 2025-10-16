import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Plus, Edit, Trash, Save } from 'lucide-react';

const BackupRestorePage = () => {
    const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await api.request('get', '/api/backup-restore-items');
        setItems(response);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">BackupRestore</h1>
          <p className="text-muted-foreground">Backup and restore system</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Create New</Button>
      </div>

      {loading && <p className="text-center text-muted-foreground">Loading items...</p>}
      {error && <p className="text-center text-red-500">Error loading items: {error.message}</p>}

      {!loading && !error && items.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Items Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              It looks like there are no backup or restore items yet. Click "Create New" to add your first item.
            </p>
            <Button><Plus className="mr-2 h-4 w-4" />Create Your First Item</Button>
          </CardContent>
        </Card>
      )}
      {!loading && !error && items.length > 0 && (
        <div className="grid gap-4">
          {items.map(item => (
          <Card key={item.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Database className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">Created: {item.created}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.status}
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


    </div>
  );
};

export default BackupRestorePage;