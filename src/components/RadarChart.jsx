export default function RadarChart({ skills, size = 220 }) {
  const labels = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
  const values = [skills.pace, skills.shooting, skills.passing, skills.dribbling, skills.defending, skills.physical];
  const center = size / 2;
  const radius = size / 2 - 30;
  const angleStep = (Math.PI * 2) / 6;

  const getPoint = (value, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const gridLevels = [20, 40, 60, 80, 100];

  const dataPoints = values.map((v, i) => getPoint(v, i));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid */}
      {gridLevels.map((level) => {
        const points = Array.from({ length: 6 }, (_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const r = (level / 100) * radius;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon
            key={level}
            points={points}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}

      {/* Axis lines */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}

      {/* Data shape */}
      <polygon
        points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(16, 185, 129, 0.15)"
        stroke="#10b981"
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#10b981" />
      ))}

      {/* Labels */}
      {labels.map((label, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const labelR = radius + 18;
        const x = center + labelR * Math.cos(angle);
        const y = center + labelR * Math.sin(angle);
        return (
          <g key={i}>
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-text-muted"
              style={{ fontSize: '10px', fontFamily: 'Outfit' }}
            >
              {label}
            </text>
            <text
              x={x}
              y={y + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-text-secondary"
              style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'Outfit' }}
            >
              {values[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
