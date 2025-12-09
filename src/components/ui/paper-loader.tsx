'use client'

type PaperLoaderProps = {
  size?: number
  className?: string
}

export function PaperLoader({ size = 32, className = '' }: PaperLoaderProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <div className="paper-flip-animation" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <path
            d="M8 2H16C17.1046 2 18 2.89543 18 4V20C18 21.1046 17.1046 22 16 22H8C6.89543 22 6 21.1046 6 20V4C6 2.89543 6.89543 2 8 2Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M9 6H15M9 10H15M9 14H12"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes paperFlip {
            0%, 100% {
              transform: perspective(400px) rotateY(0deg);
              opacity: 1;
            }
            50% {
              transform: perspective(400px) rotateY(180deg);
              opacity: 0.6;
            }
          }

          .paper-flip-animation {
            animation: paperFlip 1.5s ease-in-out infinite;
            transform-style: preserve-3d;
          }
        `
      }} />
    </div>
  )
}
