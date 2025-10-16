import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Download, Eye } from 'lucide-react';

const InvoicesPage = () => {
  const invoices = [
    { id: 'INV-001', client: 'ABC Ltd', amount: 2500, status: 'paid', date: '2024-10-01' },
    { id: 'INV-002', client: 'XYZ Corp', amount: 3200, status: 'pending', date: '2024-10-10' },
    { id: 'INV-003', client: 'Tech Solutions', amount: 1800, status: 'overdue', date: '2024-09-25' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage client invoices</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Create Invoice</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Invoices</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map(invoice => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">{invoice.id}</h3>
                    <p className="text-sm text-muted-foreground">{invoice.client} • {invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">£{invoice.amount.toLocaleString()}</span>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                    invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {invoice.status}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost"><Download className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesPage;
