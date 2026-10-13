import React from 'react';

interface CampusFixLogoProps {
  /**
   * Layout format of the logo:
   * - 'icon': Only the circular 'C' with wrench & action rays
   * - 'horizontal': Icon on left, "CampusFix" wordmark on right
   * - 'stacked': Centered large icon with "CampusFix" wordmark below
   */
  variant?: 'icon' | 'horizontal' | 'stacked';
  /**
   * Predefined size tiers or pixel scale
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Theme mode for text contrast:
   * - 'dark': For dark backgrounds (text "Campus" renders in white)
   * - 'light': For light backgrounds (text "Campus" renders in deep slate #0f172a)
   */
  textMode?: 'dark' | 'light';
  /**
   * Optional subtitle, e.g. "Intelligent Maintenance System" or "Institutional Suite"
   */
  subtitle?: string;
  className?: string;
}

export const CampusFixIcon: React.FC<{ sizePx?: number; className?: string }> = ({
  sizePx = 36,
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      width={sizePx}
      height={sizePx}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-xs select-none ${className}`}
      aria-label="CampusFix Icon"
    >
      <defs>
        {/* Main 'C' Gradient: Rich Royal Blue to Electric Sky Cyan */}
        <linearGradient id="cf-c-grad-react" x1="15%" y1="90%" x2="90%" y2="15%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="35%" stopColor="#2563eb" />
          <stop offset="70%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        {/* Wrench Gradient */}
        <linearGradient id="cf-wrench-grad-react" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="60%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        {/* Spark Rays Gradient */}
        <linearGradient id="cf-spark-grad-react" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* 3 Radiating Dynamic Action Sparks at Top-Right */}
      <line
        x1="68"
        y1="21"
        x2="71"
        y2="12"
        stroke="url(#cf-spark-grad-react)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <line
        x1="75"
        y1="28"
        x2="84"
        y2="23"
        stroke="url(#cf-spark-grad-react)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <line
        x1="77"
        y1="37"
        x2="86"
        y2="39"
        stroke="url(#cf-spark-grad-react)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Bold Circular 'C' Body */}
      <path
        d="M 66.5 36 A 26 26 0 1 0 66.5 68"
        stroke="url(#cf-c-grad-react)"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />

      {/* Angled Wrench in the Center Void (angled at 45 deg, pointing into opening) */}
      <g transform="translate(46, 52) rotate(45)">
        <path
          d="M -3.2 13 C -3.2 15 -1.5 16 0 16 C 1.5 16 3.2 15 3.2 13 L 3.2 -1 C 5.5 -2.2 7.2 -4.6 7.2 -7.5 C 7.2 -9.2 6.5 -10.8 5.5 -12 L 3 -8 L -3 -8 L -5.5 -12 C -6.5 -10.8 -7.2 -9.2 -7.2 -7.5 C -7.2 -4.6 -5.5 -2.2 -3.2 -1 Z"
          fill="url(#cf-wrench-grad-react)"
        />
      </g>
    </svg>
  );
};

export const CampusFixLogo: React.FC<CampusFixLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  textMode = 'light',
  subtitle,
  className = '',
}) => {
  const sizeMap = {
    xs: { icon: 20, text: 'text-sm', sub: 'text-[9px]' },
    sm: { icon: 28, text: 'text-base', sub: 'text-[10px]' },
    md: { icon: 38, text: 'text-xl', sub: 'text-[11px]' },
    lg: { icon: 54, text: 'text-2xl sm:text-3xl', sub: 'text-xs' },
    xl: { icon: 76, text: 'text-3xl sm:text-4xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  if (variant === 'icon') {
    return <CampusFixIcon sizePx={currentSize.icon} className={className} />;
  }

  const campusTextColor = textMode === 'dark' ? 'text-white' : 'text-slate-900';

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <CampusFixIcon sizePx={currentSize.icon} className="mb-2" />
        <div className="flex items-center tracking-tight leading-none">
          <span className={`font-extrabold ${campusTextColor} ${currentSize.text}`}>
            Campus
          </span>
          <span className={`font-extrabold bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent ${currentSize.text}`}>
            Fix
          </span>
        </div>
        {subtitle && (
          <p className={`mt-1 font-medium text-slate-500 ${currentSize.sub}`}>
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <CampusFixIcon sizePx={currentSize.icon} />
      <div className="flex flex-col leading-none">
        <div className="flex items-center tracking-tight">
          <span className={`font-extrabold ${campusTextColor} ${currentSize.text}`}>
            Campus
          </span>
          <span className={`font-extrabold bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent ${currentSize.text}`}>
            Fix
          </span>
        </div>
        {subtitle && (
          <span className={`font-medium text-slate-500 mt-0.5 ${currentSize.sub}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
