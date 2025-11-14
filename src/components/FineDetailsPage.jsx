import React from 'react'
import { AlertCircle, Calendar, DollarSign, Building, FileText } from 'lucide-react'

const FineDetailsPage = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Fine Details</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="Fine title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Authority</label>
            <select className="w-full px-4 py-2 border rounded-lg">
              <option>HMRC</option>
              <option>Companies House</option>
              <option>HSE</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
            <input type="date" className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Potential Fine</label>
            <input type="number" className="w-full px-4 py-2 border rounded-lg" placeholder="£0.00" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FineDetailsPage
