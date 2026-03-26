"use client";

import type { ReactNode } from "react";

export function CardGrid<T>({
  items,
  renderCard,
  empty,
}: Readonly<{
  items: T[];
  renderCard: (item: T) => ReactNode;
  empty?: ReactNode;
}>) {
  if (items.length === 0) return empty ?? null;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, idx) => (
        <div key={idx}>{renderCard(item)}</div>
      ))}
    </div>
  );
}

