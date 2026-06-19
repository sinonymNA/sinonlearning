// A linearly-separable toy "spam or not spam" dataset plus a real perceptron learning rule,
// so the decision boundary sandbox visualizes an actual training loop converging, not a fake one.

export interface BoundaryPoint {
  x: number; // 0-10, "number of links"
  y: number; // 0-10, "number of exclamation marks"
  label: 0 | 1; // 1 = spam
}

export interface LinearModel {
  w0: number; // weight on x
  w1: number; // weight on y
  b: number; // bias
}

export const SPAM_DATASET: BoundaryPoint[] = [
  { x: 0.5, y: 1, label: 0 },
  { x: 1, y: 2.5, label: 0 },
  { x: 1.5, y: 0.5, label: 0 },
  { x: 2, y: 2, label: 0 },
  { x: 2.5, y: 3.5, label: 0 },
  { x: 1, y: 4, label: 0 },
  { x: 3, y: 1, label: 0 },
  { x: 3.5, y: 3, label: 0 },
  { x: 0.5, y: 3, label: 0 },
  { x: 2, y: 4.5, label: 0 },
  { x: 6, y: 6, label: 1 },
  { x: 7, y: 8, label: 1 },
  { x: 8, y: 5.5, label: 1 },
  { x: 6.5, y: 9, label: 1 },
  { x: 9, y: 7, label: 1 },
  { x: 7.5, y: 6.5, label: 1 },
  { x: 8.5, y: 9, label: 1 },
  { x: 5.5, y: 7.5, label: 1 },
  { x: 9.5, y: 8.5, label: 1 },
  { x: 6, y: 5, label: 1 },
];

export const INITIAL_MODEL: LinearModel = { w0: 0.2, w1: -0.3, b: 0.5 };

export function classify(model: LinearModel, point: { x: number; y: number }): 0 | 1 {
  return model.w0 * point.x + model.w1 * point.y + model.b >= 0 ? 1 : 0;
}

export function modelAccuracy(model: LinearModel, dataset: BoundaryPoint[]): number {
  const correct = dataset.filter((p) => classify(model, p) === p.label).length;
  return correct / dataset.length;
}

// One pass of the classic perceptron update rule over every point.
export function perceptronStep(model: LinearModel, dataset: BoundaryPoint[], learningRate = 0.05): LinearModel {
  let { w0, w1, b } = model;
  for (const point of dataset) {
    const prediction = w0 * point.x + w1 * point.y + b >= 0 ? 1 : 0;
    const error = point.label - prediction;
    if (error !== 0) {
      w0 += learningRate * error * point.x;
      w1 += learningRate * error * point.y;
      b += learningRate * error;
    }
  }
  return { w0, w1, b };
}

// Convert w0*x + w1*y + b = 0 into the line's y-value at x=0 and x=10, for drawing/sliders.
export function boundaryEndpoints(model: LinearModel): { leftY: number; rightY: number } {
  const yAt = (x: number) => {
    if (Math.abs(model.w1) < 1e-6) return model.w0 * x + model.b >= 0 ? -1000 : 1000;
    return -(model.w0 * x + model.b) / model.w1;
  };
  return { leftY: yAt(0), rightY: yAt(10) };
}
