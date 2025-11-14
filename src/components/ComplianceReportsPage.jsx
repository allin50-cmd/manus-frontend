import React from 'react'
import { FileText, Download, Calendar } from 'lucide-react'

const ComplianceReportsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Compliance Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Monthly Report', 'Quarterly Report', 'Annual Report'].map((report, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <FileText className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{report}</h3>
            <p className="text-sm text-gray-600 mb-4">Comprehensive compliance overview</p>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ComplianceReportsPage
