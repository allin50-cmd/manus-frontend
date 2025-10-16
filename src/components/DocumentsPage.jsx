import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Folder, Search, Download, Trash2, Eye } from 'lucide-react';

const DocumentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');

  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [errorFolders, setErrorFolders] = useState(null);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setLoadingFolders(true);
        const response = await api.get('/api/folders');
        setFolders([{ id: 'all', name: 'All Documents', count: response.data.reduce((acc, folder) => acc + folder.count, 0) }, ...response.data]);
      } catch (err) {
        setErrorFolders('Failed to load folders.');
        console.error('Failed to fetch folders:', err);
      } finally {
        setLoadingFolders(false);
      }
    };
    fetchFolders();
  }, []);

  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [errorDocuments, setErrorDocuments] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoadingDocuments(true);
        const response = await api.get('/api/documents');
        setDocuments(response);
      } catch (err) {
        setErrorDocuments('Failed to load documents.');
        console.error('Failed to fetch documents:', err);
      } finally {
        setLoadingDocuments(false);
      }
    };
    fetchDocuments();
  }, []);

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
        {loadingFolders && <p>Loading folders...</p>}
        {errorFolders && <p className="text-red-500">{errorFolders}</p>}
        {!loadingFolders && !errorFolders && (
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
        )}

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
            {loadingDocuments && <p>Loading documents...</p>}
            {errorDocuments && <p className="text-red-500">{errorDocuments}</p>}
            {!loadingDocuments && !errorDocuments && documents.length === 0 && <p>No documents found.</p>}
            {!loadingDocuments && !errorDocuments && filteredDocs.length > 0 && (
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
            )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;

