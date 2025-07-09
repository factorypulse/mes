'use client';

import { cn } from '@/lib/utils';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 'md',
  strokeWidth,
  variant = 'primary',
  showPercentage = true,
  className,
  children,
}: ProgressRingProps) {
  const getSizeConfig = (size: string) => {
    switch (size) {
      case 'sm':
        return { dimension: 48, stroke: strokeWidth || 3, text: 'text-xs' };
      case 'md':
        return { dimension: 64, stroke: strokeWidth || 4, text: 'text-sm' };
      case 'lg':
        return { dimension: 96, stroke: strokeWidth || 5, text: 'text-base' };
      case 'xl':
        return { dimension: 128, stroke: strokeWidth || 6, text: 'text-lg' };
      default:
        return { dimension: 64, stroke: strokeWidth || 4, text: 'text-sm' };
    }
  };

  const getVariantColor = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'stroke-green-500';
      case 'warning':
        return 'stroke-yellow-500';
      case 'error':
        return 'stroke-red-500';
      default:
        return 'stroke-primary';
    }
  };

  const config = getSizeConfig(size);
  const radius = (config.dimension - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center rounded-full', className)}>
      <svg
        width={config.dimension}
        height={config.dimension}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-muted/20"
        />

        {/* Progress circle with animation */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          fill="transparent"
          strokeWidth={config.stroke}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-1000 ease-out',
            getVariantColor(variant)
          )}
          style={{
            filter: 'drop-shadow(0 0 6px currentColor)',
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (showPercentage && (
          <span className={cn(
            'font-bold gradient-text',
            config.text
          )}>
            {Math.round(progress)}%
          </span>
        ))}
      </div>

      {/* Glow effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-full opacity-20 blur-md',
          variant === 'success' && 'bg-green-500',
          variant === 'warning' && 'bg-yellow-500',
          variant === 'error' && 'bg-red-500',
          variant === 'primary' && 'bg-primary'
        )}
        style={{
          transform: `scale(${0.3 + (progress / 100) * 0.7})`,
          transition: 'transform 1s ease-out',
        }}
      />
    </div>
  );
}
