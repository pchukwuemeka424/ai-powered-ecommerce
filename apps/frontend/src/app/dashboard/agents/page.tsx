'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { agentsApi } from '@/lib/api';
import { Button, Badge, Card, Tabs, StatCard, Spinner } from '@/components/ui';
import { Bot, Zap, Play, MessageSquare, TrendingUp, Brain, ShoppingCart, Megaphone, Users } from 'lucide-react';

interface Task {
  _id: string;
  agentType: string;
  status: string;
  priority: number;
  createdAt: string;
  completedAt?: string;
  result?: Record<string, unknown>;
  error?: string;
}

interface Message {
  id: string;
  from: string;
  to: string;
  type: string;
  timestamp: string;
}

interface OrchestratorStats {
  isRunning: boolean;
  activeCount: number;
  queueDepth: number;
  registeredAgents: string[];
}

const AGENT_CONFIG = [
  { type: 'store_intelligence', label: 'Store Intelligence', icon: Brain, desc: 'Analyzes your store and defines business strategy' },
  { type: 'product_intelligence', label: 'Product Intelligence', icon: ShoppingCart, desc: 'Generates products and optimizes pricing' },
  { type: 'marketing', label: 'Marketing', icon: Megaphone, desc: 'Creates campaigns and adapts messaging' },
  { type: 'customer_support', label: 'Customer Support', icon: Users, desc: 'Handles customer queries and learns from interactions' },
  { type: 'growth_optimization', label: 'Growth Optimizer', icon: TrendingUp, desc: 'Analyzes performance and identifies growth opportunities' },
];

export default function AgentsPage() {
  const { currentStore } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [insights, setInsights] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState<OrchestratorStats | null>(null);
  const [activeTab, setActiveTab] = useState('agents');
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState<string | null>(null);

  useEffect(() => {
    if (!currentStore) return;
    loadAll();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, [currentStore]);

  async function loadAll() {
    if (!currentStore) return;
    setLoading(true);
    try {
      await Promise.allSettled([loadTasks(), loadInsights(), loadMessages()]);
    } finally {
      setLoading(false);
    }
  }

  async function loadTasks() {
    if (!currentStore) return;
    const { data } = await agentsApi.getTasks(currentStore.id, { limit: 30 });
    setTasks(data.tasks ?? []);
  }

  async function loadInsights() {
    if (!currentStore) return;
    const { data } = await agentsApi.getInsights(currentStore.id);
    setInsights(data);
    setStats(data.orchestratorStats as OrchestratorStats ?? null);
  }

  async function loadMessages() {
    if (!currentStore) return;
    const { data } = await agentsApi.getMessages(currentStore.id);
    setMessages(data.messages ?? []);
  }

  async function dispatchAgent(agentType: string, payload: Record<string, unknown> = {}) {
    if (!currentStore) return;
    setDispatching(agentType);
    try {
      await agentsApi.dispatch(currentStore.id, agentType, payload);
      await loadTasks();
    } finally {
      setDispatching(null);
    }
  }

  const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
    completed: 'success',
    running: 'warning',
    failed: 'danger',
    queued: 'default',
    cancelled: 'danger',
  };

  const tabs = [
    { id: 'agents', label: 'Agents' },
    { id: 'tasks', label: 'Task Log', count: tasks.length },
    { id: 'messages', label: 'Messages', count: messages.length },
    { id: 'insights', label: 'Insights' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">AI Agents</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Autonomous agents powering your store</p>
        </div>
        <div className="flex items-center gap-2">
          {stats?.isRunning ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-slow" />
              <span className="text-xs font-medium text-emerald-700">Orchestrator running</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-neutral-400 rounded-full" />
              <span className="text-xs text-neutral-500">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Orchestrator stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active Tasks" value={stats?.activeCount ?? 0} icon={<Zap size={16} />} />
        <StatCard label="Queue Depth" value={stats?.queueDepth ?? 0} icon={<Bot size={16} />} />
        <StatCard label="Agents Available" value={stats?.registeredAgents?.length ?? 0} icon={<Brain size={16} />} />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Agents panel */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENT_CONFIG.map((agent) => {
            const Icon = agent.icon;
            const agentTasks = tasks.filter((t) => t.agentType === agent.type);
            const latestTask = agentTasks[0];
            const isRunning = latestTask?.status === 'running';

            return (
              <Card key={agent.type} className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-black">{agent.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{agent.desc}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-500 mb-3">
                  <span>{agentTasks.length} tasks run</span>
                  {latestTask && (
                    <Badge variant={statusVariant[latestTask.status] ?? 'default'}>
                      {latestTask.status}
                    </Badge>
                  )}
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  variant="secondary"
                  onClick={() => dispatchAgent(agent.type, { action: 'analyze' })}
                  loading={dispatching === agent.type || isRunning}
                >
                  <Play size={12} />
                  {isRunning ? 'Running...' : 'Dispatch'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task log */}
      {activeTab === 'tasks' && (
        <Card>
          {loading ? (
            <div className="py-12 flex justify-center">
              <Spinner />
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-sm">
              No tasks dispatched yet. Run an agent to get started.
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {tasks.map((task) => (
                <div key={task._id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Bot size={14} className="text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black capitalize">
                        {task.agentType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-neutral-400">
                        Priority {task.priority} · {new Date(task.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.error && (
                      <span className="text-xs text-red-500 max-w-xs truncate">{task.error}</span>
                    )}
                    <Badge variant={statusVariant[task.status] ?? 'default'}>{task.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Messages */}
      {activeTab === 'messages' && (
        <Card>
          {messages.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-sm">
              No inter-agent messages yet. Messages appear when agents communicate.
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {messages.map((msg) => (
                <div key={msg.id} className="px-5 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-black capitalize">
                      {msg.from.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-neutral-400">→</span>
                    <span className="text-xs font-medium text-black capitalize">
                      {msg.to.replace(/_/g, ' ')}
                    </span>
                    <span className="ml-auto text-[10px] text-neutral-400">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 font-mono">{msg.type}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Insights */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {insights && (
            <>
              {/* Strategy */}
              {(insights.storeStrategy as Record<string, unknown>) && (
                <Card className="p-5">
                  <h3 className="text-sm font-semibold mb-3">Store Strategy</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(insights.storeStrategy as Record<string, unknown>).slice(0, 6).map(([k, v]) => (
                      <div key={k}>
                        <p className="text-xs text-neutral-500 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="font-medium text-black mt-0.5">
                          {Array.isArray(v) ? (v as string[]).join(', ') : String(v)}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Recommendations */}
              {Array.isArray(insights.recommendations) && (insights.recommendations as Record<string, unknown>[]).length > 0 && (
                <Card className="p-5">
                  <h3 className="text-sm font-semibold mb-3">Active Recommendations</h3>
                  <div className="space-y-3">
                    {(insights.recommendations as Record<string, unknown>[]).map((rec, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-neutral-50 rounded-lg">
                        <div className="w-1 bg-black rounded-full flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-black">{String(rec.title)}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{String(rec.description)}</p>
                        </div>
                        <Badge
                          variant={rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'default'}
                          className="ml-auto flex-shrink-0 self-start"
                        >
                          {String(rec.priority)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
