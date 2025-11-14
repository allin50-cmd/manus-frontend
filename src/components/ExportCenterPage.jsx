import React from 'react'
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react'

const ExportCenterPage = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Export Center</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { name: 'Export to PDF', icon: FileText, format: 'PDF' },
          { name: 'Export to CSV', icon: Table, format: 'CSV' },
          { name: 'Export to Excel', icon: FileSpreadsheet, format: 'XLSX' },
          { name: 'Export to JSON', icon: FileText, format: 'JSON' }
        ].map((option, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <option.icon className="w-10 h-10 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold">{option.name}</h3>
                <p className="text-sm text-gray-600">Export data in {option.format} format</p>
              </div>
            </div>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Export {option.format}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ExportCenterPage
