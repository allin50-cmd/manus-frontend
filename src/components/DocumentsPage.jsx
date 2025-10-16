import { useState } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Folder, Search, Download, Trash2, Eye } from 'lucide-react';

const DocumentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');

  const folders = [
    { id: 'all', name: 'All Documents', count: 24 },
    { id: 'contracts', name: 'Contracts', count: 8 },
    { id: 'invoices', name: 'Invoices', count: 12 },
    { id: 'reports', name: 'Reports', count: 4 }
  ];

  const documents = [
    {
      id: 1,
      name: 'Service Agreement 2024.pdf',
      folder: 'contracts',
      size: '245 KB',
      date: '2024-10-15',
      type: 'pdf'
    },
    {
      id: 2,
      name: 'Invoice INV-001.pdf',
      folder: 'invoices',
      size: '128 KB',
      date: '2024-10-14',
      type: 'pdf'
    },
    {
      id: 3,
      name: 'Monthly Report Sept.xlsx',
      folder: 'reports',
      size: '512 KB',
      date: '2024-10-01',
      type: 'excel'
    }
  ];

  const filteredDocs = documents.filter(doc => 
    (selectedFolder === 'all' || doc.folder === selectedFolder) &&
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage your business documents</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Folders Sidebar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Folders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {folders.map(folder => (
              <Button
                key={folder.id}
                variant={selectedFolder === folder.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedFolder(folder.id)}
              >
                <Folder className="mr-2 h-4 w-4" />
                {folder.name}
                <span className="ml-auto text-xs">{folder.count}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="md:col-span-3 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Documents Grid */}
          <div className="grid gap-4">
            {filteredDocs.map(doc => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{doc.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {doc.size} • {doc.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;

