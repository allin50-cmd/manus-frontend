import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, TrendingUp, DollarSign, PieChart, BarChart3, Filter } from 'lucide-react';

const ReportsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedType, setSelectedType] = useState('all');

  const reports = [
    {
      id: 1,
      name: 'Monthly Financial Report',
      type: 'financial',
      date: '2024-10-01',
      size: '2.4 MB',
      status: 'ready',
      description: 'Complete financial overview for October 2024'
    },
    {
      id: 2,
      name: 'Compliance Status Report',
      type: 'compliance',
      date: '2024-10-15',
      size: '1.8 MB',
      status: 'ready',
      description: 'Current compliance obligations and status'
    },
    {
      id: 3,
      name: 'Tax Summary Q3 2024',
      type: 'tax',
      date: '2024-09-30',
      size: '3.1 MB',
      status: 'ready',
      description: 'Quarterly tax summary and projections'
    },
    {
      id: 4,
      name: 'Payroll Report October',
      type: 'payroll',
      date: '2024-10-31',
      size: '1.2 MB',
      status: 'processing',
      description: 'Monthly payroll summary and analysis'
    }
  ];

  const reportTypes = [
    { value: 'all', label: 'All Reports', icon: FileText },
    { value: 'financial', label: 'Financial', icon: DollarSign },
    { value: 'compliance', label: 'Compliance', icon: TrendingUp },
    { value: 'tax', label: 'Tax', icon: PieChart },
    { value: 'payroll', label: 'Payroll', icon: BarChart3 }
  ];

  const filteredReports = selectedType === 'all' 
    ? reports 
    : reports.filter(r => r.type === selectedType);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and download business reports</p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Generate New Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex gap-2">
              {reportTypes.map(type => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? 'default' : 'outline'}
                  onClick={() => setSelectedType(type.value)}
                  size="sm"
                >
                  <type.icon className="mr-2 h-4 w-4" />
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredReports.map(report => (
          <Card key={report.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{report.name}</h3>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {report.date}
                      </span>
                      <span>{report.size}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        report.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                </div>
                <Button disabled={report.status !== 'ready'}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;

