import { NextResponse } from "next/server";
import { fetchCyberNews } from "@/lib/rss";

export const revalidate = 900;

export async function GET() {
  const news = await fetchCyberNews(revalidate);
  const { items, failedSources, sourceCount } = news;

  return NextResponse.json(
    news,
    {
      status: items.length === 0 && failedSources === sourceCount ? 502 : 200,
      headers: { "Cache-Control": `s-maxage=${revalidate}, stale-while-revalidate=3600` },
    },
  );
}
