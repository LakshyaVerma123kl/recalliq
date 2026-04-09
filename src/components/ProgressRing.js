"use client";

export default function ProgressRing({ progress = 0, size = 80, strokeWidth = 6, className = "" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress >= 90) return "#10b981"; // emerald
    if (progress >= 50) return "#f59e0b"; // amber
    if (progress > 0) return "#f97316"; // orange
    return "#475569"; // slate
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="progress-ring-circle"
          style={{
            filter: `drop-shadow(0 0 6px ${getColor()}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color: getColor() }}>
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
