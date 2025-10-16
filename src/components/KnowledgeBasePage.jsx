import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';

const KnowledgeBasePage = () => {
  const [knowledgeBaseItems, setKnowledgeBaseItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchKnowledgeBase = async () => {
      try {
        const response = await api.request('/knowledgebase');
        setKnowledgeBaseItems(response);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchKnowledgeBase();
  }, []);
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
          {loading && <p>Loading knowledge base...</p>}
          {error && <p className="text-red-500">Error: {error.message}</p>}
          {!loading && knowledgeBaseItems.length === 0 && <p className="text-muted-foreground">No knowledge base items found.</p>}
          {!loading && knowledgeBaseItems.length > 0 && (
            <div className="grid gap-4">
              {knowledgeBaseItems.map((item, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{item.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBasePage;