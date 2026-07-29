"use client";

import { useEffect, useState } from "react";

/** True only after client mount — avoids Recharts / Date hydration mismatches. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
