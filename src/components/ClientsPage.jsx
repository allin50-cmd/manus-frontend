import { useState } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Mail, Phone, Building2 } from 'lucide-react';

const ClientsPage = () => {
  const clients = [
    { id: 1, name: 'ABC Ltd', contact: 'John Smith', email: 'john@abc.com', phone: '020 1234 5678', status: 'active' },
    { id: 2, name: 'XYZ Corp', contact: 'Jane Doe', email: 'jane@xyz.com', phone: '020 8765 4321', status: 'active' },
    { id: 3, name: 'Tech Solutions', contact: 'Bob Wilson', email: 'bob@tech.com', phone: '020 5555 1234', status: 'inactive' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your client database</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add Client</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map(client => (
          <Card key={client.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {client.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm"><strong>Contact:</strong> {client.contact}</p>
              <p className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {client.email}
              </p>
              <p className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {client.phone}
              </p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {client.status}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientsPage;
