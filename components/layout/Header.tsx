import * as React from "react";

import { useEffect, useMemo, useRef, useState } from "react";
export function Header({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between px-5 pb-5 mb-4 pt-[max(1.25rem,env(safe-area-inset-top))] bg-white">
      <div>
        <h1 className="mt-1 text-sm font-medium tracking-tight">{title}</h1>
      </div>
      {action}
    </header>
  );
}
