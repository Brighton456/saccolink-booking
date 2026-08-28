export function SkeletonCard() {
  return (
    <div className="rounded-[var(--scl-radius-xl)] border border-[var(--scl-border)] bg-[var(--scl-card)] p-6 shadow-sm">
      <div className="mb-4 flex gap-3">
        <div className="skeleton h-6 w-20 rounded-lg" />
        <div className="skeleton h-4 w-32 rounded-md" />
      </div>
      <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
        <div>
          <div className="skeleton mb-2 h-8 w-24 rounded-lg" />
          <div className="skeleton h-4 w-16 rounded-md" />
        </div>
        <div className="skeleton mx-4 h-0.5 w-16 rounded-full" />
        <div className="text-right">
          <div className="skeleton mb-2 h-8 w-24 rounded-lg" />
          <div className="skeleton ml-auto h-4 w-16 rounded-md" />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-[var(--scl-border)] pt-4">
        <div>
          <div className="skeleton mb-1 h-4 w-12 rounded-md" />
          <div className="skeleton h-8 w-20 rounded-lg" />
        </div>
        <div className="skeleton h-12 w-32 rounded-2xl" />
      </div>
    </div>
  );
}

export function SkeletonSeatMap() {
  return (
    <div className="flex flex-col items-center">
      <div className="skeleton mb-4 h-4 w-48 rounded-md" />
      <div className="rounded-[40px_40px_10px_10px] border-4 border-[var(--scl-border)] bg-[var(--scl-card)] p-6">
        <div className="mb-6 flex justify-between">
          <div className="flex gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton h-14 w-12 rounded-t-2xl rounded-b-lg" />
            ))}
          </div>
          <div className="skeleton h-14 w-12 rounded-full" />
        </div>
        {[0, 1, 2, 3].map((r) => (
          <div key={r} className="mb-4 flex gap-2 pl-10">
            {[0, 1, 2].map((s) => (
              <div key={s} className="skeleton h-14 w-12 rounded-t-2xl rounded-b-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonHome() {
  return (
    <div className="animate-fade-in px-4 pt-6">
      <div className="mb-8">
        <div className="skeleton mb-3 h-10 w-64 rounded-xl" />
        <div className="skeleton h-5 w-48 rounded-md" />
      </div>
      <div className="skeleton mb-6 h-64 w-full rounded-[var(--scl-radius-xl)]" />
      <div className="grid grid-cols-1 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-24 w-full rounded-[var(--scl-radius)]" />
        ))}
      </div>
    </div>
  );
}
