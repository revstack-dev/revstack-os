import Link from "next/link";

export function PoweredBy() {
  return (
    <div className="flex items-center justify-center gap-1.5 pt-6">
      <span className="text-xs text-zinc-400 dark:text-zinc-500">
        Powered by{" "}
        <Link
          href="https://revstack.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          Revstack
        </Link>
      </span>
    </div>
  );
}
