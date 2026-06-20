interface Props {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export default function ProgressRing({ progress, size = 80, strokeWidth = 6, color = 'var(--primary)' }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="progress-ring-circle">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color }}>
        {Math.round(progress)}%
      </span>
    </div>
  );
}
