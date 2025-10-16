import { BarChart3, TrendingUp, TrendingDown, Activity, Users, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';

export default function AnalyticsPage() {
  const stats = {
    totalCompanies: 3,
    activeObligations: 15,
    completedThisMonth: 12,
    overdueItems: 3,
    avgComplianceScore: 62.7,
    penaltyRisk: 5800,
    trendsUp: 2,
    trendsDown: 1
  };

  const monthlyData = [
    { month: 'Jun', completed: 8, overdue: 2 },
    { month: 'Jul', completed: 10, overdue: 1 },
    { month: 'Aug', completed: 12, overdue: 3 },
    { month: 'Sep', completed: 15, overdue: 2 },
    { month: 'Oct', completed: 12, overdue: 3 }
  ];

  const companyPerformance = [
    { name: 'Tech Innovations Ltd', score: 65, trend: 'up', change: '+5%' },
    { name: 'Global Solutions Ltd', score: 78, trend: 'up', change: '+8%' },
    { name: 'Startup Ventures Ltd', score: 45, trend: 'down', change: '-12%' }
  ];

  const upcomingDeadlines = [
    { task: 'VAT Return', company: 'Tech Innovations', daysLeft: 5, priority: 'high' },
    { task: 'Confirmation Statement', company: 'Global Solutions', daysLeft: 15, priority: 'medium' },
    { task: 'Annual Accounts', company: 'Startup Ventures', daysLeft: 30, priority: 'low' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-cyan-500" />
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">Track your compliance performance and trends</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">Active monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedThisMonth}</div>
            <p className="text-xs text-muted-foreground">+20% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueItems}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Compliance Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgComplianceScore}%</div>
            <p className="text-xs text-muted-foreground">Overall health</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Completed vs Overdue obligations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{data.month}</span>
                    <span className="text-muted-foreground">{data.completed + data.overdue} total</span>
                  </div>
                  <div className="flex gap-1 h-8">
                    <div
                      className="bg-green-500 rounded flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${(data.completed / (data.completed + data.overdue)) * 100}%` }}
                    >
                      {data.completed}
                    </div>
                    <div
                      className="bg-red-500 rounded flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${(data.overdue / (data.completed + data.overdue)) * 100}%` }}
                    >
                      {data.overdue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Overdue</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Company Performance</CardTitle>
            <CardDescription>Compliance scores and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companyPerformance.map((company, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{company.name}</span>
                    <div className="flex items-center gap-2">
                      {company.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        company.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {company.change}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          company.score >= 70 ? 'bg-green-500' :
                          company.score >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${company.score}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{company.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>Next 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingDeadlines.map((deadline, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="flex-1">
                  <p className="font-medium">{deadline.task}</p>
                  <p className="text-sm text-muted-foreground">{deadline.company}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{deadline.daysLeft} days</p>
                    <p className="text-xs text-muted-foreground">remaining</p>
                  </div>
                  <Badge className={
                    deadline.priority === 'high' ? 'bg-red-500' :
                    deadline.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }>
                    {deadline.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

