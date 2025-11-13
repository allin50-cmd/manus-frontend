// Realistic UK Fine Management Demo Data

export const demoCompanies = [
  {
    id: 1,
    name: 'Thames Digital Solutions Ltd',
    registrationNumber: '12345678',
    fineRiskScore: 92,
    activeFines: 2,
    overdueCount: 0,
    totalFineValue: 1500,
    nextDeadline: '2024-12-31',
    industry: 'Technology'
  },
  {
    id: 2,
    name: 'Manchester Retail Group PLC',
    registrationNumber: '87654321',
    fineRiskScore: 78,
    activeFines: 5,
    overdueCount: 1,
    totalFineValue: 4200,
    nextDeadline: '2024-11-30',
    industry: 'Retail'
  },
  {
    id: 3,
    name: 'Birmingham Manufacturing Co',
    registrationNumber: '11223344',
    fineRiskScore: 85,
    activeFines: 3,
    overdueCount: 0,
    totalFineValue: 2800,
    nextDeadline: '2024-12-15',
    industry: 'Manufacturing'
  },
  {
    id: 4,
    name: 'Edinburgh Financial Services',
    registrationNumber: '44332211',
    fineRiskScore: 95,
    activeFines: 1,
    overdueCount: 0,
    totalFineValue: 500,
    nextDeadline: '2025-01-31',
    industry: 'Finance'
  },
  {
    id: 5,
    name: 'Cardiff Property Developments',
    registrationNumber: '55667788',
    fineRiskScore: 65,
    activeFines: 7,
    overdueCount: 2,
    totalFineValue: 8500,
    nextDeadline: '2024-11-20',
    industry: 'Property'
  }
]

export const demoFines = [
  {
    id: 1,
    companyId: 1,
    companyName: 'Thames Digital Solutions Ltd',
    title: 'Annual Confirmation Statement',
    description: 'File annual confirmation statement with Companies House',
    authority: 'Companies House',
    dueDate: '2024-12-31',
    potentialFine: 750,
    status: 'pending',
    priority: 'medium',
    category: 'Corporate',
    assignedTo: 'Sarah Johnson'
  },
  {
    id: 2,
    companyId: 1,
    companyName: 'Thames Digital Solutions Ltd',
    title: 'VAT Return Q4 2024',
    description: 'Submit quarterly VAT return to HMRC',
    authority: 'HMRC',
    dueDate: '2025-01-31',
    potentialFine: 400,
    status: 'pending',
    priority: 'high',
    category: 'Tax',
    assignedTo: 'Michael Chen'
  },
  {
    id: 3,
    companyId: 2,
    companyName: 'Manchester Retail Group PLC',
    title: 'Corporation Tax Payment',
    description: 'Pay corporation tax for financial year 2023/24',
    authority: 'HMRC',
    dueDate: '2024-11-30',
    potentialFine: 2000,
    status: 'pending',
    priority: 'critical',
    category: 'Tax',
    assignedTo: 'Emma Williams'
  },
  {
    id: 4,
    companyId: 2,
    companyName: 'Manchester Retail Group PLC',
    title: 'PAYE/NIC Payment',
    description: 'Monthly PAYE and National Insurance payment',
    authority: 'HMRC',
    dueDate: '2024-11-22',
    potentialFine: 500,
    status: 'overdue',
    priority: 'critical',
    category: 'Payroll',
    assignedTo: 'James Brown'
  },
  {
    id: 5,
    companyId: 3,
    companyName: 'Birmingham Manufacturing Co',
    title: 'Health & Safety Report',
    description: 'Submit annual health and safety compliance report',
    authority: 'HSE',
    dueDate: '2024-12-15',
    potentialFine: 1500,
    status: 'pending',
    priority: 'high',
    category: 'Regulatory',
    assignedTo: 'David Taylor'
  },
  {
    id: 6,
    companyId: 3,
    companyName: 'Birmingham Manufacturing Co',
    title: 'Environmental Permit Renewal',
    description: 'Renew environmental operating permit',
    authority: 'Environment Agency',
    dueDate: '2024-12-20',
    potentialFine: 800,
    status: 'pending',
    priority: 'medium',
    category: 'Environmental',
    assignedTo: 'Sophie Anderson'
  },
  {
    id: 7,
    companyId: 4,
    companyName: 'Edinburgh Financial Services',
    title: 'FCA Annual Return',
    description: 'Submit annual return to Financial Conduct Authority',
    authority: 'FCA',
    dueDate: '2025-01-31',
    potentialFine: 5000,
    status: 'pending',
    priority: 'high',
    category: 'Financial Regulation',
    assignedTo: 'Oliver Martin'
  },
  {
    id: 8,
    companyId: 5,
    companyName: 'Cardiff Property Developments',
    title: 'Building Control Inspection',
    description: 'Schedule mandatory building control inspection',
    authority: 'Local Authority',
    dueDate: '2024-11-20',
    potentialFine: 1200,
    status: 'pending',
    priority: 'high',
    category: 'Planning',
    assignedTo: 'Lucy Davies'
  },
  {
    id: 9,
    companyId: 5,
    companyName: 'Cardiff Property Developments',
    title: 'CIS Return',
    description: 'Submit Construction Industry Scheme monthly return',
    authority: 'HMRC',
    dueDate: '2024-11-19',
    potentialFine: 300,
    status: 'overdue',
    priority: 'critical',
    category: 'Tax',
    assignedTo: 'Thomas Wilson'
  },
  {
    id: 10,
    companyId: 2,
    companyName: 'Manchester Retail Group PLC',
    title: 'Annual Accounts Filing',
    description: 'File annual accounts with Companies House',
    authority: 'Companies House',
    dueDate: '2024-12-31',
    potentialFine: 1500,
    status: 'pending',
    priority: 'high',
    category: 'Corporate',
    assignedTo: 'Emma Williams'
  }
]

export const demoDocuments = [
  {
    id: 1,
    name: 'VAT Return Q3 2024.pdf',
    type: 'pdf',
    size: '245 KB',
    uploadDate: '2024-10-15',
    category: 'Tax Returns',
    companyId: 1,
    fineId: 2
  },
  {
    id: 2,
    name: 'Confirmation Statement 2024.pdf',
    type: 'pdf',
    size: '180 KB',
    uploadDate: '2024-11-01',
    category: 'Corporate Documents',
    companyId: 1,
    fineId: 1
  },
  {
    id: 3,
    name: 'Health Safety Certificate.pdf',
    type: 'pdf',
    size: '320 KB',
    uploadDate: '2024-09-20',
    category: 'Regulatory',
    companyId: 3,
    fineId: 5
  },
  {
    id: 4,
    name: 'FCA Registration.pdf',
    type: 'pdf',
    size: '450 KB',
    uploadDate: '2024-08-10',
    category: 'Financial Regulation',
    companyId: 4,
    fineId: 7
  },
  {
    id: 5,
    name: 'Building Plans Approval.pdf',
    type: 'pdf',
    size: '2.1 MB',
    uploadDate: '2024-10-05',
    category: 'Planning',
    companyId: 5,
    fineId: 8
  }
]

export const demoAuditLogs = [
  {
    id: 1,
    timestamp: '2024-11-13 14:30:00',
    user: 'Sarah Johnson',
    action: 'Updated fine',
    details: 'Marked "Annual Confirmation Statement" as in progress',
    type: 'update'
  },
  {
    id: 2,
    timestamp: '2024-11-13 13:15:00',
    user: 'Michael Chen',
    action: 'Added document',
    details: 'Uploaded VAT Return Q3 2024.pdf',
    type: 'create'
  },
  {
    id: 3,
    timestamp: '2024-11-13 11:45:00',
    user: 'Emma Williams',
    action: 'Created fine',
    details: 'Added new fine: Corporation Tax Payment',
    type: 'create'
  },
  {
    id: 4,
    timestamp: '2024-11-13 10:20:00',
    user: 'James Brown',
    action: 'Updated company',
    details: 'Updated Manchester Retail Group PLC details',
    type: 'update'
  },
  {
    id: 5,
    timestamp: '2024-11-13 09:00:00',
    user: 'System',
    action: 'Sent notification',
    details: 'Email reminder sent for PAYE/NIC Payment deadline',
    type: 'notification'
  }
]

export const demoReports = [
  {
    id: 1,
    name: 'Monthly Fine Summary - November 2024',
    type: 'summary',
    generatedDate: '2024-11-13',
    format: 'PDF',
    size: '1.2 MB'
  },
  {
    id: 2,
    name: 'Overdue Fines Report',
    type: 'overdue',
    generatedDate: '2024-11-12',
    format: 'Excel',
    size: '85 KB'
  },
  {
    id: 3,
    name: 'Fine Risk Analysis Q4 2024',
    type: 'analysis',
    generatedDate: '2024-11-10',
    format: 'PDF',
    size: '2.5 MB'
  },
  {
    id: 4,
    name: 'Company Fine Compliance Scores',
    type: 'compliance',
    generatedDate: '2024-11-08',
    format: 'PDF',
    size: '950 KB'
  }
]

export const demoUsers = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    role: 'Fine Manager',
    assignedFines: 5,
    lastActive: '2024-11-13 14:30:00'
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    role: 'Tax Specialist',
    assignedFines: 3,
    lastActive: '2024-11-13 13:15:00'
  },
  {
    id: 3,
    name: 'Emma Williams',
    email: 'emma.williams@example.com',
    role: 'Fine Manager',
    assignedFines: 4,
    lastActive: '2024-11-13 11:45:00'
  },
  {
    id: 4,
    name: 'James Brown',
    email: 'james.brown@example.com',
    role: 'Payroll Specialist',
    assignedFines: 2,
    lastActive: '2024-11-13 10:20:00'
  }
]

export const demoStats = {
  totalFines: 10,
  activeFines: 8,
  overdueFines: 2,
  completedFines: 15,
  totalFineValue: 17500,
  avgFineRiskScore: 83,
  companiesManaged: 5,
  upcomingDeadlines: 6
}

