import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Upload, Search, Filter, FileText, Download, Eye, Trash2, Share2, Lock, Unlock, Folder, FolderOpen, File, Image, FileSpreadsheet, Archive, Star, Clock, User } from 'lucide-react'

const EnhancedDocumentVault = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedDocs, setSelectedDocs] = useState([])

  // Sample folders
  const folders = [
    { id: 1, name: 'Tax Returns', count: 12, icon: '💷', color: 'bg-blue-100' },
    { id: 2, name: 'Annual Accounts', count: 8, icon: '📊', color: 'bg-green-100' },
    { id: 3, name: 'Contracts', count: 15, icon: '📝', color: 'bg-purple-100' },
    { id: 4, name: 'Insurance', count: 6, icon: '🛡️', color: 'bg-yellow-100' },
    { id: 5, name: 'FineGuard Certificates', count: 10, icon: '✓', color: 'bg-red-100' },
    { id: 6, name: 'Board Minutes', count: 24, icon: '📋', color: 'bg-indigo-100' },
  ]

  // Sample documents
  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: 'VAT_Return_Q4_2024.pdf',
      type: 'pdf',
      size: '2.4 MB',
      uploadedBy: 'John Smith',
      uploadedDate: '2024-11-01',
      folder: 'Tax Returns',
      tags: ['VAT', 'Q4', '2024'],
      isLocked: false,
      isStarred: true,
      version: '1.0',
      lastModified: '2024-11-01',
      description: 'Quarterly VAT return for October-December 2024'
    },
    {
      id: 2,
      name: 'Annual_Accounts_2024.xlsx',
      type: 'excel',
      size: '5.1 MB',
      uploadedBy: 'Sarah Johnson',
      uploadedDate: '2024-10-28',
      folder: 'Annual Accounts',
      tags: ['Accounts', '2024', 'Financial'],
      isLocked: true,
      isStarred: false,
      version: '2.3',
      lastModified: '2024-10-30',
      description: 'Complete annual accounts for financial year 2024'
    },
    {
      id: 3,
      name: 'Insurance_Policy_2024.pdf',
      type: 'pdf',
      size: '1.8 MB',
      uploadedBy: 'Mike Davis',
      uploadedDate: '2024-10-15',
      folder: 'Insurance',
      tags: ['Insurance', 'Policy', '2024'],
      isLocked: false,
      isStarred: true,
      version: '1.0',
      lastModified: '2024-10-15',
      description: 'Business insurance policy document'
    },
    {
      id: 4,
      name: 'Service_Agreement_ClientA.docx',
      type: 'word',
      size: '856 KB',
      uploadedBy: 'John Smith',
      uploadedDate: '2024-10-20',
      folder: 'Contracts',
      tags: ['Contract', 'Client A', 'Service'],
      isLocked: true,
      isStarred: false,
      version: '1.5',
      lastModified: '2024-10-22',
      description: 'Service agreement with Client A'
    },
    {
      id: 5,
      name: 'Board_Meeting_Minutes_Nov2024.pdf',
      type: 'pdf',
      size: '645 KB',
      uploadedBy: 'Sarah Johnson',
      uploadedDate: '2024-11-05',
      folder: 'Board Minutes',
      tags: ['Board', 'Minutes', 'November'],
      isLocked: false,
      isStarred: false,
      version: '1.0',
      lastModified: '2024-11-05',
      description: 'Minutes from November 2024 board meeting'
    },
    {
      id: 6,
      name: 'ISO_9001_Certificate.pdf',
      type: 'pdf',
      size: '1.2 MB',
      uploadedBy: 'Mike Davis',
      uploadedDate: '2024-09-30',
      folder: 'FineGuard Certificates',
      tags: ['ISO', 'Certificate', 'Quality'],
      isLocked: true,
      isStarred: true,
      version: '1.0',
      lastModified: '2024-09-30',
      description: 'ISO 9001 quality management certification'
    },
  ])

  const getFileIcon = (type) => {
    switch(type) {
      case 'pdf': return <FileText className="w-8 h-8 text-red-500" />
      case 'excel': return <FileSpreadsheet className="w-8 h-8 text-green-500" />
      case 'word': return <File className="w-8 h-8 text-blue-500" />
      case 'image': return <Image className="w-8 h-8 text-purple-500" />
      case 'zip': return <Archive className="w-8 h-8 text-yellow-500" />
      default: return <File className="w-8 h-8 text-gray-500" />
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || doc.type === filterType
    const matchesFolder = !selectedFolder || doc.folder === selectedFolder
    return matchesSearch && matchesType && matchesFolder
  })

  const toggleStar = (id) => {
    setDocuments(documents.map(doc => 
      doc.id === id ? { ...doc, isStarred: !doc.isStarred } : doc
    ))
  }

  const toggleLock = (id) => {
    setDocuments(documents.map(doc => 
      doc.id === id ? { ...doc, isLocked: !doc.isLocked } : doc
    ))
  }

  const deleteDocument = (id) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter(doc => doc.id !== id))
    }
  }

  const toggleSelectDoc = (id) => {
    if (selectedDocs.includes(id)) {
      setSelectedDocs(selectedDocs.filter(docId => docId !== id))
    } else {
      setSelectedDocs([...selectedDocs, id])
    }
  }

  const stats = {
    total: documents.length,
    starred: documents.filter(d => d.isStarred).length,
    locked: documents.filter(d => d.isLocked).length,
    totalSize: documents.reduce((sum, d) => sum + parseFloat(d.size), 0).toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Document Vault</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Secure storage for all your fineguard documents</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Starred</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.starred}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Locked</p>
                  <p className="text-2xl font-bold text-red-600">{stats.locked}</p>
                </div>
                <Lock className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Size</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSize} MB</p>
                </div>
                <Archive className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Folders Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Folders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${!selectedFolder ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Folder className="w-5 h-5" />
                        <span className="font-medium">All Documents</span>
                      </div>
                      <Badge variant="outline">{documents.length}</Badge>
                    </div>
                  </button>

                  {folders.map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.name)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${selectedFolder === folder.name ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{folder.icon}</span>
                          <span className="font-medium text-sm">{folder.name}</span>
                        </div>
                        <Badge variant="outline">{folder.count}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents Area */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search documents..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <select
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="word">Word</option>
                    <option value="image">Image</option>
                  </select>

                  <div className="flex items-center gap-1 border rounded-lg p-1">
                    <Button 
                      variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      Grid
                    </Button>
                    <Button 
                      variant={viewMode === 'list' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      List
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredDocuments.map(doc => (
                  <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        {getFileIcon(doc.type)}
                        <div className="flex items-center gap-1">
                          <button onClick={() => toggleStar(doc.id)}>
                            <Star className={`w-4 h-4 ${doc.isStarred ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                          </button>
                          <button onClick={() => toggleLock(doc.id)}>
                            {doc.isLocked ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                      </div>

                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 truncate" title={doc.name}>
                        {doc.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {doc.description}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>v{doc.version}</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {doc.tags.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span>{doc.uploadedBy}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteDocument(doc.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDocuments.map(doc => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedDocs.includes(doc.id)}
                            onChange={() => toggleSelectDoc(doc.id)}
                            className="w-4 h-4"
                          />
                          {getFileIcon(doc.type)}
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{doc.name}</h3>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>{doc.size}</span>
                              <span>{doc.uploadedBy}</span>
                              <span>{new Date(doc.uploadedDate).toLocaleDateString('en-GB')}</span>
                              <Badge variant="outline">{doc.folder}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleStar(doc.id)}>
                            <Star className={`w-4 h-4 ${doc.isStarred ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                          </button>
                          <button onClick={() => toggleLock(doc.id)}>
                            {doc.isLocked ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-gray-400" />}
                          </button>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteDocument(doc.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredDocuments.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No documents found</h3>
                  <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or upload a new document</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedDocumentVault

