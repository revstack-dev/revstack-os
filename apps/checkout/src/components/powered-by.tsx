export function PoweredBy() {
  return (
    <div className="flex items-center justify-center gap-1.5 pt-6">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-zinc-400 dark:text-zinc-500"
      >
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M12 12h.01" />
        <path d="M17 12h.01" />
        <path d="M7 12h.01" />
      </svg>
      <span className="text-xs text-zinc-400 dark:text-zinc-500">
        Powered by{" "}
        <a
          href="https://revstack.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          Revstack
        </a>
      </span>
    </div>
  );
}
