import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { CheckCircle, Plus } from 'lucide-react';

const ComplianceDashboardPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ComplianceDashboard</h1>
          <p className="text-muted-foreground">Monitor compliance status</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add New</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            ComplianceDashboard Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Monitor compliance status. Full functionality coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceDashboardPage;
