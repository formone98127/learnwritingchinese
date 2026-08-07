export type CharStrokeData = {
  /** SVG outline paths in a 1024x1024 y-up box (flip via translate(0,900) scale(1,-1)) */
  strokes: string[];
  /** Center-line polylines per stroke, same coordinate space */
  medians: number[][][];
};

export type Point = { x: number; y: number };

export type StrokeInfo = {
  index: number;
  name: string;
  outline: string;
  median: Point[];
  length: number;
};
