import { useState, useEffect } from 'react';
import { formatRelativeTime } from '@/utils/formatting';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, GitCommit, Rocket } from 'lucide-react';
import { toast } from 'sonner';

interface Deployment {
  id: string;
  environment: string;
  status: string;
  commit: string;
  workflowRun: string;
  deployedAt: string;
}

export function DeploymentStatusPanel() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchDeploymentStatus();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDeploymentStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeploymentStatus = async () => {
    try {
      const response = await fetch('/api/deployments/status');
      if (response.ok) {
        const data = await response.json();
        setDeployments(data.deployments || []);
        setLastRefresh(new Date());
      } else {
        console.error('Failed to fetch deployment status');
      }
    } catch (error) {
      console.error('Error fetching deployment status:', error);
      toast.error('Failed to load deployment status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchDeploymentStatus();
    toast.success('Deployment status refreshed');
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment.toLowerCase()) {
      case 'prod':
      case 'production':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'staging':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'dev':
      case 'development':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'in_progress':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };



  const getGitHubWorkflowUrl = (workflowRun: string) => {
    // Assuming GitHub repo is configured in environment
    const repo = import.meta.env.VITE_GITHUB_REPO || 'owner/repo';
    return `https://github.com/${repo}/actions/runs/${workflowRun}`;
  };

  const formatCommitHash = (commit: string) => {
    return commit.substring(0, 7);
  };

  // Sort deployments by environment order: prod, staging, dev
  const sortedDeployments = [...deployments].sort((a, b) => {
    const order = { prod: 0, production: 0, staging: 1, dev: 2, development: 2 };
    return (order[a.environment.toLowerCase() as keyof typeof order] || 3) -
           (order[b.environment.toLowerCase() as keyof typeof order] || 3);
  });

  return (
    <Card className="bg-[#13151C] border-[#2A2D3A]">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-[#5A4BFF]" />
              Deployment Status
            </CardTitle>
            <CardDescription className="text-sm text-gray-400 mt-1">
              Latest deployment status across all environments
            </CardDescription>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
            className="bg-[#1A1D28] border-[#2A2D3A] hover:bg-[#252830]"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && deployments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
            Loading deployment status...
          </div>
        ) : deployments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Rocket className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No deployments recorded yet</p>
            <p className="text-sm mt-2">Deployments will appear here after GitHub Actions runs</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDeployments.map((deployment) => (
              <div
                key={deployment.id}
                className="flex items-center justify-between p-4 rounded-lg bg-[#1A1D28] border border-[#2A2D3A] hover:border-[#3A3D4A] transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {getStatusIcon(deployment.status)}
                  </div>

                  {/* Environment Badge */}
                  <div className="flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={`${getEnvironmentColor(deployment.environment)} uppercase font-semibold px-3 py-1`}
                    >
                      {deployment.environment}
                    </Badge>
                  </div>

                  {/* Status and Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${getStatusColor(deployment.status)} capitalize`}>
                        {deployment.status.replace('_', ' ')}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400 text-sm">
                        {formatRelativeTime(deployment.deployedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <GitCommit className="w-3 h-3" />
                        <code className="font-mono">{formatCommitHash(deployment.commit)}</code>
                      </div>
                      <span className="text-gray-600">•</span>
                      <span className="font-mono">Run #{deployment.workflowRun}</span>
                    </div>
                  </div>

                  {/* View Workflow Link */}
                  <div className="flex-shrink-0">
                    <a
                      href={getGitHubWorkflowUrl(deployment.workflowRun)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-[#5A4BFF] hover:text-[#6B5BFF] transition-colors"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {/* Last Refresh Info */}
            <div className="text-xs text-gray-500 text-center pt-2 border-t border-[#2A2D3A]">
              Last refreshed: {formatRelativeTime(lastRefresh.toISOString())}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
