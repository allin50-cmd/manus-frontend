export interface ConfidenceInputs {
  batteryHealth: number;           // 0–1
  commReliability: number;         // fraction of peers with phi < 1
  taskProgressRate: number;        // 0–1
  sensorFidelity: number;          // 0–1
}

const W = { battery: 0.3, comm: 0.3, task: 0.2, sensor: 0.2 };

export function computeConfidence(inputs: ConfidenceInputs): number {
  return Math.max(0, Math.min(1,
    inputs.batteryHealth * W.battery +
    inputs.commReliability * W.comm +
    inputs.taskProgressRate * W.task +
    inputs.sensorFidelity * W.sensor,
  ));
}

export function confidenceAction(score: number): string {
  if (score >= 0.9) return 'full_auto';
  if (score >= 0.7) return 'increase_redundancy';
  if (score >= 0.4) return 'engage_reflex_layer';
  return 'emergency_rth';
}

// Synthetic sensor that drifts realistically
export class SyntheticSensor {
  private battery: number;
  private sensor: number;
  private task: number;

  constructor(seed: number) {
    this.battery = 0.85 + seed * 0.1;
    this.sensor = 0.9 + seed * 0.05;
    this.task = 0.75 + seed * 0.1;
  }

  tick(commReliability: number): ConfidenceInputs {
    this.battery = Math.max(0.1, Math.min(1, this.battery + (Math.random() - 0.51) * 0.005));
    this.sensor = Math.max(0.5, Math.min(1, this.sensor + (Math.random() - 0.5) * 0.01));
    this.task = Math.max(0.3, Math.min(1, this.task + (Math.random() - 0.48) * 0.008));
    return { batteryHealth: this.battery, commReliability, taskProgressRate: this.task, sensorFidelity: this.sensor };
  }
}
