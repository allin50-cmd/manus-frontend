import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, Plus } from 'lucide-react';

const MarketingPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Marketing</h1>
          <p className="text-muted-foreground">Marketing campaigns</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add New</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Marketing Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Marketing campaigns. Full functionality coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingPage;
