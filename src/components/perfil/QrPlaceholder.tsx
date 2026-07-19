"use client";

export default function QrPlaceholder() {
  const blocks: { x: number; y: number; dark: boolean }[] = [];
  const size = 200;
  const cell = 8;
  const cols = size / cell;

  for (let row = 0; row < cols; row++) {
    for (let col = 0; col < cols; col++) {
      const isFinder =
        (row < 7 && col < 7) ||
        (row < 7 && col >= cols - 7) ||
        (row >= cols - 7 && col < 7);
      const dark =
        isFinder
          ? !(row === 0 || row === 6 || col === 0 || col === 6)
          : (row + col) % 3 === 0;
      blocks.push({ x: col * cell, y: row * cell, dark });
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      {blocks.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={cell}
          height={cell}
          fill={b.dark ? "#374151" : "#e5e7eb"}
        />
      ))}
    </svg>
  );
}
