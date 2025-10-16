import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, TrendingUp, DollarSign, PieChart, BarChart3, Filter } from 'lucide-react';

const ReportsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedType, setSelectedType] = useState('all');

  const [reports, setReports] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingReportTypes, setLoadingReportTypes] = useState(true);
  const [errorReports, setErrorReports] = useState(null);
  const [errorReportTypes, setErrorReportTypes] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        const response = await api.get('/reports');
        setReports(response);
      } catch (err) {
        setErrorReports(err);
      } finally {
        setLoadingReports(false);
      }
    };

    const fetchReportTypes = async () => {
      try {
        setLoadingReportTypes(true);
        const response = await api.get('/report-types');
        setReportTypes(response);
      } catch (err) {
        setErrorReportTypes(err);
      } finally {
        setLoadingReportTypes(false);
      }
    };

    fetchReports();
    fetchReportTypes();
  }, []);

  // Add 'All Reports' option to fetched report types
  const allReportTypes = [{ value: 'all', label: 'All Reports', icon: FileText }, ...reportTypes];



  const filteredReports = selectedType === 'all' 
    ? reports 
    : reports.filter(r => r.type === selectedType);

  if (loadingReports || loadingReportTypes) {
    return <div className="space-y-6">Loading reports...</div>;
  }

  if (errorReports || errorReportTypes) {
    return <div className="space-y-6 text-red-500">Error loading reports: {errorReports?.message || errorReportTypes?.message}</div>;
  }

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
              {allReportTypes.map(type => (
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
          {!loading && !error && <div className="text-center py-4 text-muted-foreground">No data available.</div>}
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
