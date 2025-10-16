import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layout, Plus, Edit, Trash } from 'lucide-react';

const DashboardBuilderPage = () => {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const data = await api.request('/api/users');
        setDashboards(data.map(user => ({
          id: user.id,
          name: `Dashboard for ${user.name}`,
          status: user.status,
          created: user.created,
          widgets: 5
        })));
      } catch (error) {
        console.error('Failed to load dashboards:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboards();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Builder</h1>
          <p className="text-muted-foreground">Build custom dashboards</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Create New</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading dashboards...</p>
      ) : (
        <div className="grid gap-4">
          {dashboards.map(dashboard => (
            <Card key={dashboard.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Layout className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">{dashboard.name}</h3>
                      <p className="text-sm text-muted-foreground">{dashboard.widgets} widgets • Created: {dashboard.created}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      dashboard.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {dashboard.status}
                    </span>
                    <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost"><Trash className="h-4 w-4" /></Button>
                  </div>
                </div>
                {!loading && !error && <div className="text-center py-4 text-muted-foreground">No data available.</div>}
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
            Build custom dashboards. Click "Create New" to get started.
          </p>
          <Button><Plus className="mr-2 h-4 w-4" />Create Your First Dashboard</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardBuilderPage;

