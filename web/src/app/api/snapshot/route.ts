import { NextResponse } from "next/server";
import { fetchBotSnapshot } from "@/lib/freqtrade";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let cache: { at: number; body: unknown } | null = null;
const TTL_MS = 5_000;

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json(cache.body, {
      headers: { "Cache-Control": "no-store", "X-Cache": "HIT" },
    });
  }

  const snapshot = await fetchBotSnapshot();
  cache = { at: Date.now(), body: snapshot };
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store", "X-Cache": "MISS" },
  });
}
