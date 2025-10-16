import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';

const KnowledgeBasePage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">KnowledgeBase</h1>
          <p className="text-muted-foreground">Browse documentation</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add New</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            KnowledgeBase Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Browse documentation. Full functionality coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBasePage;
