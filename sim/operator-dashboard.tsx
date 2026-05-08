import React, { useEffect, useState, useCallback, Component, ReactNode } from "react";
import {
  createInitialSwarm,
  runSimulationTick,
  queueOperatorOverrides,
  OperatorOverride,
} from "./swarm-simulator";
import { groupCells } from "../core/cell-manager";
import { UltraEvent } from "../core/event-log";
import { SwarmNode, FailureState } from "../core/types";

const STATE_COLORS: Record<FailureState, string> = {
  GREEN:      "bg-green-500",
  AMBER:      "bg-amber-400",
  RED:        "bg-red-500",
  BLACK:      "bg-neutral-800 border border-white/20",
  RECOVER:    "bg-cyan-600",
  QUARANTINE: "bg-purple-600",
};

function confidenceColor(value: number, red: number, amber: number): string {
  if (value < red) return "bg-red-500";
  if (value < amber) return "bg-amber-400";
  return "bg-green-400";
}

// ─── Error boundary ──────────────────────────────────────────
class SimErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  handleReset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-950 text-white p-6 font-mono flex items-center justify-center">
          <div className="border border-red-500/40 rounded-xl p-8 max-w-lg bg-red-950/30 space-y-4">
            <p className="text-red-400 font-bold text-lg">Simulation error</p>
            <p className="text-gray-300 text-sm font-mono break-all">
              {(this.state.error as Error).message}
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-sm"
            >
              ↺ Reset simulation
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Dashboard ───────────────────────────────────────────────
export default function OperatorDashboard() {
  const [tick, setTick] = useState(0);
  const [nodes, setNodes] = useState<SwarmNode[]>(createInitialSwarm());
  const [eventLog, setEventLog] = useState<UltraEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [overrides, setOverrides] = useState<OperatorOverride[]>([]);

  const advance = useCallback(() => {
    setTick((prevTick) => {
      const nextTick = prevTick + 1;
      queueOperatorOverrides(overrides);
      const result = runSimulationTick({
        missionId: "MISSION-001",
        tick: nextTick,
        nodes,
        eventLog,
      });
      setNodes(result.nodes);
      setEventLog(result.eventLog);
      setOverrides([]);
      return nextTick;
    });
  }, [nodes, eventLog, overrides]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(advance, 1500);
    return () => clearInterval(timer);
  }, [running, advance]);

  const handleReset = () => {
    setRunning(false);
    setTick(0);
    setNodes(createInitialSwarm());
    setEventLog([]);
    setOverrides([]);
    queueOperatorOverrides([]);
  };

  const handleApproveResume = (nodeId: string) =>
    setOverrides((prev) => [...prev, { nodeId, type: "approveResume" }]);

  const handleForceSafeHold = (nodeId: string) =>
    setOverrides((prev) => [...prev, { nodeId, type: "forceSafeHold" }]);

  const handleReleaseQuarantine = (nodeId: string) =>
    setOverrides((prev) => [...prev, { nodeId, type: "releaseQuarantine" }]);

  const cells = groupCells(nodes);

  return (
    <SimErrorBoundary>
      <main className="min-h-screen bg-gray-950 text-white p-6 font-mono">
        <header className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-cyan-300 tracking-widest">ULTRACORE CONTROL</p>
            <h1 className="text-3xl font-bold">Graceful Failure Operator Dashboard</h1>
            <p className="text-gray-400">Tick: {tick}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setRunning(!running)} className="px-4 py-2 rounded bg-white/10 hover:bg-white/20">
              {running ? "⏸ Pause" : "▶ Run"}
            </button>
            <button onClick={advance} className="px-4 py-2 rounded bg-white/10 hover:bg-white/20">
              ⏭ Step
            </button>
            <button onClick={handleReset} className="px-4 py-2 rounded bg-white/10 hover:bg-white/20">
              ↺ Reset
            </button>
          </div>
        </header>

        {/* State summary — 6 states */}
        <section className="grid grid-cols-6 gap-3 mb-6">
          {(["GREEN", "AMBER", "RED", "BLACK", "RECOVER", "QUARANTINE"] as FailureState[]).map((state) => {
            const count = nodes.filter((n) => n.state === state).length;
            return (
              <div
                key={state}
                className={`rounded-xl p-4 border border-white/10 ${count > 0 ? STATE_COLORS[state] + " bg-opacity-20" : "bg-white/5"}`}
              >
                <p className="text-xs uppercase tracking-wider text-gray-300">{state}</p>
                <p className="text-3xl font-bold">{count}</p>
              </div>
            );
          })}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Node cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Swarm Nodes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nodes.map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  onApproveResume={handleApproveResume}
                  onForceSafeHold={handleForceSafeHold}
                  onReleaseQuarantine={handleReleaseQuarantine}
                />
              ))}
            </div>
          </div>

          {/* Cells & events */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Cells</h2>
            <div className="space-y-3">
              {cells.map((cell) => (
                <div
                  key={cell.cellId}
                  className={`border rounded-xl p-3 ${STATE_COLORS[cell.state]} bg-opacity-10 border-opacity-30`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-sm">{cell.cellId}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">{cell.state}</span>
                  </div>
                  <p className="text-xs text-gray-400">{cell.summary}</p>
                  <ul className="text-xs mt-2 space-y-1">
                    {cell.nodes.map((n) => (
                      <li key={n.id} className="flex justify-between">
                        <span>{n.id}</span>
                        <span className="text-gray-400">{n.currentTask ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <h2 className="text-xl font-semibold mt-6">Event Timeline</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto border border-white/10 rounded-xl p-3">
              {eventLog.slice(-25).reverse().map((event) => (
                <div key={event.eventId} className="border-b border-white/5 pb-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold">{event.nodeId}</span>
                    <span className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-300">
                    {event.previousState} → <span className="font-mono text-cyan-300">{event.nextState}</span>
                  </p>
                  <p className="text-gray-500">{event.reason}</p>
                  <p className="text-gray-400">Approved: {event.actionApproved}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </SimErrorBoundary>
  );
}

function NodeCard({
  node,
  onApproveResume,
  onForceSafeHold,
  onReleaseQuarantine,
}: {
  node: SwarmNode;
  onApproveResume: (id: string) => void;
  onForceSafeHold: (id: string) => void;
  onReleaseQuarantine: (id: string) => void;
}) {
  const stateBg = STATE_COLORS[node.state] ?? "bg-gray-700";
  const isDark = node.state === "BLACK" || node.state === "QUARANTINE";
  return (
    <div className={`border border-white/10 rounded-xl p-4 ${isDark ? "bg-gray-900" : "bg-gray-900/30"}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold">{node.id}</p>
          <p className="text-xs text-gray-400">{node.role} · {node.cellId}</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${stateBg}`}>{node.state}</span>
      </div>

      <ConfidenceBar label="Comms"     value={node.confidence.comms}       red={35} amber={70} />
      <ConfidenceBar label="Nav"       value={node.confidence.navigation}   red={45} amber={70} />
      <ConfidenceBar label="Mission"   value={node.confidence.mission}      red={40} amber={70} />
      <ConfidenceBar label="Safety"    value={node.confidence.safety}       red={60} amber={80} />
      <ConfidenceBar label="Consensus" value={node.confidence.consensus}    red={30} amber={70} />
      {node.confidence.nav_integrity !== undefined && (
        <ConfidenceBar label="Nav-I" value={node.confidence.nav_integrity}  red={40} amber={70} />
      )}
      {node.confidence.clock_health !== undefined && (
        <ConfidenceBar label="Clock" value={node.confidence.clock_health}   red={40} amber={70} />
      )}

      <div className="flex justify-between items-center mt-3 text-xs">
        <span className="text-gray-400">Task: {node.currentTask ?? "NONE"}</span>
        <div className="flex gap-1">
          {node.state === "RED" && !node.operatorResumeApproved && (
            <button
              onClick={() => onApproveResume(node.id)}
              className="px-2 py-0.5 bg-green-700 text-white rounded hover:bg-green-600"
            >
              Approve Resume
            </button>
          )}
          {node.state === "QUARANTINE" && (
            <button
              onClick={() => onReleaseQuarantine(node.id)}
              className="px-2 py-0.5 bg-purple-700 text-white rounded hover:bg-purple-600"
            >
              Release Quarantine
            </button>
          )}
          <button
            onClick={() => onForceSafeHold(node.id)}
            className="px-2 py-0.5 bg-red-700 text-white rounded hover:bg-red-600"
          >
            Force Safe Hold
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfidenceBar({
  label, value, red, amber,
}: {
  label: string; value: number; red: number; amber: number;
}) {
  const barColor = confidenceColor(value, red, amber);
  return (
    <div className="mb-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className={value < red ? "text-red-400" : ""}>{value}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
