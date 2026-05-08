import { FailureState, SwarmNode } from './types';

export interface CellGroup {
  cellId: string;
  state: FailureState;
  summary: string;
  nodes: SwarmNode[];
}

const STATE_PRIORITY: Record<FailureState, number> = {
  BLACK: 6,
  QUARANTINE: 5,
  RED: 4,
  RECOVER: 3,
  AMBER: 2,
  GREEN: 1,
};

function worstState(states: FailureState[]): FailureState {
  return states.reduce<FailureState>(
    (worst, s) => (STATE_PRIORITY[s] > STATE_PRIORITY[worst] ? s : worst),
    'GREEN'
  );
}

export function assignSwarmCells(nodes: SwarmNode[]): SwarmNode[] {
  return nodes.map((node) => {
    const cellId =
      node.state === 'GREEN'      ? 'primary-swarm'   :
      node.state === 'AMBER'      ? 'degraded-cell'   :
      node.state === 'RED'        ? 'safe-hold-cell'  :
      node.state === 'BLACK'      ? 'blackout-cell'   :
      node.state === 'QUARANTINE' ? 'quarantine-cell' :
                                    'recovery-cell';
    return { ...node, cellId };
  });
}

export function groupCells(nodes: SwarmNode[]): CellGroup[] {
  const map = new Map<string, SwarmNode[]>();
  for (const node of nodes) {
    map.set(node.cellId, [...(map.get(node.cellId) ?? []), node]);
  }
  return Array.from(map.entries()).map(([cellId, cellNodes]) => ({
    cellId,
    state: worstState(cellNodes.map((n) => n.state)),
    summary: `${cellNodes.length} node${cellNodes.length === 1 ? '' : 's'} · ${cellNodes.map((n) => n.role).join(', ')}`,
    nodes: cellNodes,
  }));
}
