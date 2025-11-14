import React from 'react'
import { Shield, Check, X } from 'lucide-react'

const PermissionsPage = () => {
  const roles = ['Admin', 'Manager', 'User', 'Viewer']
  const permissions = [
    'View Fines', 'Create Fines', 'Edit Fines', 'Delete Fines',
    'View Reports', 'Generate Reports', 'Manage Users', 'Configure Settings'
  ]

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Permissions Management</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Permission</th>
              {roles.map(role => (
                <th key={role} className="px-6 py-3 text-center">{role}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {permissions.map(perm => (
              <tr key={perm}>
                <td className="px-6 py-4 font-medium">{perm}</td>
                {roles.map(role => (
                  <td key={role} className="px-6 py-4 text-center">
                    {(role === 'Admin' || (role === 'Manager' && !perm.includes('Manage') && !perm.includes('Configure'))) ? (
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PermissionsPage
