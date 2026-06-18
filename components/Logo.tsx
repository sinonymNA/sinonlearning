export default function Logo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sinon-logo-bg" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#0d1b2e" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="sinon-logo-page" x1="16" y1="6" x2="16" y2="26">
          <stop offset="0%" stopColor="#fdfbf6" />
          <stop offset="100%" stopColor="#f0e7d3" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#sinon-logo-bg)" />
      <path
        d="M16 11.2c-1.7-1.3-4-1.9-6.4-1.6-.4 0-.7.4-.7.8v9.6c0 .5.4.9.9.8 2.1-.3 4.1.2 5.5 1.3.4.3 1 .3 1.4 0 1.4-1.1 3.4-1.6 5.5-1.3.5.1.9-.3.9-.8v-9.6c0-.4-.3-.8-.7-.8-2.4-.3-4.7.3-6.4 1.6Z"
        fill="url(#sinon-logo-page)"
      />
      <path
        d="M16 11.2v10.4"
        stroke="#0d1b2e"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.35"
      />
      <circle cx="23.5" cy="9" r="1.6" fill="#f59e0b" />
    </svg>
  );
}
