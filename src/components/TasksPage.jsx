import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Plus, Calendar } from 'lucide-react';

const TasksPage = () => {
  const tasks = [
    { id: 1, title: 'Review Q3 financial statements', status: 'pending', priority: 'high', due: '2024-10-20' },
    { id: 2, title: 'Update client database', status: 'in_progress', priority: 'medium', due: '2024-10-22' },
    { id: 3, title: 'Prepare tax documents', status: 'completed', priority: 'high', due: '2024-10-15' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your to-do list</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />New Task</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Tasks</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg">
              {task.status === 'completed' ? 
                <CheckCircle className="h-5 w-5 text-green-500" /> : 
                <Circle className="h-5 w-5 text-gray-400" />
              }
              <div className="flex-1">
                <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  Due: {task.due}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs ${
                task.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {task.priority}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TasksPage;
