import React, { useState } from 'react'
import { Building, Save, MapPin, Phone, Mail, Users } from 'lucide-react'

const CompanyDetailsPage = () => {
  const [company, setCompany] = useState({
    name: 'Acme Corporation Ltd',
    registrationNumber: '12345678',
    address: '123 Business Street, London, EC1A 1BB',
    phone: '+44 20 1234 5678',
    email: 'info@acme.com',
    employees: '50-100',
    industry: 'Technology'
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Details</h1>
          <p className="text-gray-600 mt-1">Manage your company information</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input type="text" value={company.name} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
            <input type="text" value={company.registrationNumber} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input type="text" value={company.address} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input type="tel" value={company.phone} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={company.email} className="w-full px-4 py-2 border rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyDetailsPage
