// Export utilities for CSV and PDF generation

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Array} columns - Optional array of column definitions
 */
export const exportToCSV = (data, filename = 'export', columns = null) => {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Determine columns
  let headers
  let rows

  if (columns) {
    // Use provided column definitions
    headers = columns.map(col => col.label || col.key)
    rows = data.map(item => 
      columns.map(col => {
        const value = item[col.key]
        return formatCSVValue(value)
      })
    )
  } else {
    // Auto-detect columns from first object
    headers = Object.keys(data[0])
    rows = data.map(item => 
      headers.map(header => formatCSVValue(item[header]))
    )
  }

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Create and download file
  downloadFile(csvContent, `${filename}.csv`, 'text/csv')
}

/**
 * Export fines data to CSV with proper formatting
 * @param {Array} fines - Array of fine objects
 * @param {string} filename - Name of the file
 */
export const exportFinesToCSV = (fines, filename = 'fines_export') => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Fine Title' },
    { key: 'companyName', label: 'Company' },
    { key: 'authority', label: 'Authority' },
    { key: 'category', label: 'Category' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'potentialFine', label: 'Potential Fine (£)' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'assignedTo', label: 'Assigned To' }
  ]

  exportToCSV(fines, filename, columns)
}

/**
 * Export data to PDF format (simplified version)
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file
 * @param {string} title - Title of the PDF document
 */
export const exportToPDF = (data, filename = 'export', title = 'FineGuard Export') => {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Create HTML content for PDF
  const htmlContent = generatePDFHTML(data, title)

  // Open in new window for printing
  const printWindow = window.open('', '_blank')
  printWindow.document.write(htmlContent)
  printWindow.document.close()
  
  // Trigger print dialog
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

/**
 * Export fines to PDF with proper formatting
 * @param {Array} fines - Array of fine objects
 * @param {string} filename - Name of the file
 */
export const exportFinesToPDF = (fines, filename = 'fines_export') => {
  const title = `FineGuard Fines Report - ${new Date().toLocaleDateString('en-GB')}`
  exportToPDF(fines, filename, title)
}

/**
 * Generate summary report and export to PDF
 * @param {Object} stats - Statistics object
 * @param {Array} fines - Array of fine objects
 */
export const exportSummaryReport = (stats, fines) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>FineGuard Summary Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          color: #333;
        }
        h1 {
          color: #1e40af;
          border-bottom: 3px solid #1e40af;
          padding-bottom: 10px;
        }
        h2 {
          color: #2563eb;
          margin-top: 30px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 20px 0;
        }
        .stat-card {
          border: 1px solid #e5e7eb;
          padding: 15px;
          border-radius: 8px;
          background: #f9fafb;
        }
        .stat-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #1e40af;
          color: white;
          padding: 12px;
          text-align: left;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
          background: #f9fafb;
        }
        .priority-critical { color: #dc2626; font-weight: bold; }
        .priority-high { color: #ea580c; font-weight: bold; }
        .priority-medium { color: #ca8a04; }
        .priority-low { color: #2563eb; }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <h1>FineGuard Summary Report</h1>
      <p><strong>Generated:</strong> ${new Date().toLocaleString('en-GB')}</p>

      <h2>Overview Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Active Fines</div>
          <div class="stat-value">${stats?.activeFines || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Overdue Fines</div>
          <div class="stat-value">${stats?.overdueFines || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Fine Value</div>
          <div class="stat-value">£${(stats?.totalFineValue || 0).toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Fine Risk Score</div>
          <div class="stat-value">${stats?.avgFineRiskScore || 0}/100</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Upcoming Deadlines</div>
          <div class="stat-value">${stats?.upcomingDeadlines || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Completed This Month</div>
          <div class="stat-value">${stats?.completedFines || 0}</div>
        </div>
      </div>

      <h2>Upcoming Fines</h2>
      <table>
        <thead>
          <tr>
            <th>Fine Title</th>
            <th>Company</th>
            <th>Authority</th>
            <th>Due Date</th>
            <th>Amount</th>
            <th>Priority</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${fines.slice(0, 20).map(fine => `
            <tr>
              <td>${fine.title}</td>
              <td>${fine.companyName}</td>
              <td>${fine.authority}</td>
              <td>${new Date(fine.dueDate).toLocaleDateString('en-GB')}</td>
              <td>£${fine.potentialFine.toLocaleString()}</td>
              <td class="priority-${fine.priority}">${fine.priority.toUpperCase()}</td>
              <td>${fine.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This report was generated by FineGuard - UK Fine Management System</p>
        <p>For more information, visit your FineGuard dashboard</p>
      </div>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  printWindow.document.write(htmlContent)
  printWindow.document.close()
  
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

// Helper functions

function formatCSVValue(value) {
  if (value === null || value === undefined) {
    return ''
  }
  
  const stringValue = String(value)
  
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function generatePDFHTML(data, title) {
  const headers = Object.keys(data[0])
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1e40af; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #1e40af; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        tr:hover { background: #f5f5f5; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `
}

