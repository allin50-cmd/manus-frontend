import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../utils/api';
import { Home, Users, Settings, FileText, Calendar, Briefcase, Shield } from 'lucide-react';

const SiteMapPage = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const response = await api.request('get', '/api/sitemap-sections');
        setSections(response);
      } catch (err) {
        setError('Failed to fetch sitemap sections.');
        console.error('Error fetching sitemap sections:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading sitemap...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Site Map</h1>
        <p className="text-muted-foreground">Complete navigation structure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {/* Assuming section.icon will be a string name that maps to lucide-react icons */}
                {section.icon && React.createElement(eval(section.icon), { className: 'h-5 w-5' })}
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.pages.map((page, pidx) => (
                  <li key={pidx} className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                    • {page}
                  </li>
                ))}
              </ul>
              {!loading && !error && <div className="text-center py-4 text-muted-foreground">No data available.</div>}
        </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Pages: {sections.reduce((acc, section) => acc + section.pages.length, 0)}+</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Complete enterprise platform with all features accessible through intuitive navigation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteMapPage;
