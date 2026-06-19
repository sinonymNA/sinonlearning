// A tiny, real, in-browser neural network: 2 inputs -> 3 hidden (sigmoid) -> 1 output (sigmoid).
// Trained with real batch gradient descent (manual backprop) on the classic XOR pattern, so
// students watch actual weights move during actual training, not a scripted animation.

export interface MiniNetwork {
  w1: number[][]; // 3x2 hidden weights
  b1: number[]; // 3 hidden biases
  w2: number[]; // 3 output weights
  b2: number; // output bias
}

export interface TrainingExample {
  input: [number, number];
  label: number; // 0 or 1
}

export interface ForwardResult {
  hidden: number[];
  output: number;
}

// Deterministic starting weights (no Math.random) so server/client render identically.
export const INITIAL_NETWORK: MiniNetwork = {
  w1: [
    [0.5, -0.4],
    [-0.3, 0.6],
    [0.2, 0.2],
  ],
  b1: [0.1, -0.1, 0],
  w2: [0.4, -0.5, 0.3],
  b2: 0,
};

// "Two-Sensor Alarm" — alert only when exactly one sensor is triggered (XOR).
// A single neuron can never learn this; that's the whole point of the sandbox.
export const ALARM_DATASET: TrainingExample[] = [
  { input: [0, 0], label: 0 },
  { input: [0, 1], label: 1 },
  { input: [1, 0], label: 1 },
  { input: [1, 1], label: 0 },
];

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export function forward(net: MiniNetwork, input: [number, number]): ForwardResult {
  const hidden = net.w1.map((weights, i) =>
    sigmoid(weights[0] * input[0] + weights[1] * input[1] + net.b1[i])
  );
  const output = sigmoid(hidden.reduce((sum, h, i) => sum + h * net.w2[i], 0) + net.b2);
  return { hidden, output };
}

export function trainEpoch(net: MiniNetwork, dataset: TrainingExample[], learningRate = 1.5): MiniNetwork {
  const gw1 = net.w1.map((row) => row.map(() => 0));
  const gb1 = net.b1.map(() => 0);
  const gw2 = net.w2.map(() => 0);
  let gb2 = 0;

  for (const example of dataset) {
    const { hidden, output } = forward(net, example.input);
    const dOutput = (output - example.label) * output * (1 - output);

    for (let i = 0; i < hidden.length; i++) {
      gw2[i] += dOutput * hidden[i];
    }
    gb2 += dOutput;

    for (let i = 0; i < hidden.length; i++) {
      const dHidden = dOutput * net.w2[i] * hidden[i] * (1 - hidden[i]);
      gw1[i][0] += dHidden * example.input[0];
      gw1[i][1] += dHidden * example.input[1];
      gb1[i] += dHidden;
    }
  }

  const n = dataset.length;
  return {
    w1: net.w1.map((row, i) => row.map((w, j) => w - learningRate * (gw1[i][j] / n))),
    b1: net.b1.map((b, i) => b - learningRate * (gb1[i] / n)),
    w2: net.w2.map((w, i) => w - learningRate * (gw2[i] / n)),
    b2: net.b2 - learningRate * (gb2 / n),
  };
}

export function accuracy(net: MiniNetwork, dataset: TrainingExample[]): number {
  const correct = dataset.filter((ex) => {
    const { output } = forward(net, ex.input);
    return (output >= 0.5 ? 1 : 0) === ex.label;
  }).length;
  return correct / dataset.length;
}
