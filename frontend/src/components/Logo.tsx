export function Logo({ size = 32 }: { readonly size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="18" fill="var(--accent)" />
      <path
        d="M8 20h5l3-9 5 18 3-9h8"
        fill="none"
        stroke="var(--accent-foreground)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
