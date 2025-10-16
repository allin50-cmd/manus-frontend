import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Play, Pause, Settings, Activity, List, Terminal, BookOpen, Loader2 } from 'lucide-react';

const AIAgentManagementPage = () => {
  const [activeTab, setActiveTab] = useState('agents');

  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [commands, setCommands] = useState([]);
  const [loadingCommands, setLoadingCommands] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoadingAgents(true);
        const response = await api.get('/api/agents');
        setAgents(response.data);
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoadingAgents(false);
      }
    };

    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        const response = await api.get('/api/tasks');
        setTasks(response.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    const fetchActivities = async () => {
      try {
        setLoadingActivities(true);
        const response = await api.get('/api/activities');
        setActivities(response.data);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoadingActivities(false);
      }
    };

    const fetchCommands = async () => {
      try {
        setLoadingCommands(true);
        const response = await api.get('/api/commands');
        setCommands(response.data);
      } catch (error) {
        console.error('Error fetching commands:', error);
      } finally {
        setLoadingCommands(false);
      }
    };

    fetchAgents();
    fetchTasks();
    fetchActivities();
    fetchCommands();
  }, []);

  const renderTabContent = () => {
    switch(activeTab) {
      case 'agents':
        if (loadingAgents) return <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        return (
          <div className="grid gap-4">
            {agents.length === 0 ? (
              <p className="text-center text-muted-foreground">No agents found.</p>
            ) : (
              agents.map(agent => (
                <Card key={agent.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Bot className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-semibold text-lg">{agent.name}</h3>
                          <p className="text-sm text-muted-foreground">{agent.tasks} tasks completed</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Accuracy</p>
                          <p className="font-semibold">{agent.accuracy}%</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          agent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {agent.status}
                        </span>
                        <Button size="sm" variant="ghost">
                          {agent.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="ghost"><Settings className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );

      case 'tasks':
        if (loadingTasks) return <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        return (
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-center text-muted-foreground">No tasks found.</p>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <List className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{task.task}</p>
                      <p className="text-sm text-muted-foreground">{task.agent}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{task.time}</span>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'running' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'activities':
        if (loadingActivities) return <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        return (
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-center text-muted-foreground">No activities found.</p>
            ) : (
              activities.map(activity => (
                <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Activity className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.agent}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.timestamp}</span>
                </div>
              ))
            )}
          </div>
        );

      case 'commands':
        if (loadingCommands) return <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        return (
          <div className="space-y-4">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <p>$ agent --help</p>
              <p className="mt-2 text-gray-400">Available commands:</p>
            </div>
            {commands.length === 0 ? (
              <p className="text-center text-muted-foreground">No commands found.</p>
            ) : (
              commands.map((cmd, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <p className="font-mono text-sm font-semibold">{cmd.command}</p>
                  <p className="text-sm text-muted-foreground mt-1">{cmd.description}</p>
                </div>
              ))
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI Agent Management</h1>
          <p className="text-muted-foreground">Manage and monitor AI agents</p>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {['agents', 'tasks', 'activities', 'commands'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>{renderTabContent()}</div>
    </div>
  );
};

export default AIAgentManagementPage;