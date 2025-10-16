import { useState } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Clock, MapPin } from 'lucide-react';

const CalendarPage = () => {
  const events = [
    { id: 1, title: 'Tax Filing Deadline', date: '2024-10-31', time: '17:00', type: 'deadline' },
    { id: 2, title: 'Client Meeting - ABC Ltd', date: '2024-10-18', time: '14:00', type: 'meeting' },
    { id: 3, title: 'Payroll Processing', date: '2024-10-25', time: '09:00', type: 'task' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">Manage appointments and deadlines</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add Event</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {event.date} at {event.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage;
