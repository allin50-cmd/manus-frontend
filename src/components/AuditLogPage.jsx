import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { Shield, Plus } from 'lucide-react';

const AuditLogPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setIsLoading(true);
        const response = await api.request('/api/auditlogs'); // Assuming this is the endpoint
        setAuditLogs(response);
      } catch (err) {
        setError(err);
        console.error('Error fetching audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AuditLog</h1>
          <p className="text-muted-foreground">View security and activity logs</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />Add New</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            AuditLog Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading audit logs...</p>}
          {error && <p className="text-red-500">Error: {error.message}</p>}
          {!isLoading && !error && auditLogs.length === 0 && (
            <p className="text-muted-foreground">No audit logs found.</p>
          )}
          {!isLoading && !error && auditLogs.length > 0 && (
            <div>
              {/* Render your audit logs here. This is a placeholder. */}
              <p>Displaying {auditLogs.length} audit logs.</p>
              <ul>
                {auditLogs.map((log, index) => (
                  <li key={index}>{JSON.stringify(log)}</li> // Example rendering
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogPage;