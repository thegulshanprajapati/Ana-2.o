import { NextResponse } from 'next/server';
import { getTokenUsage } from '@/lib/local-data';

export async function GET() {
  try {
    const rawUsage = await getTokenUsage();
    
    // Sort by date ascending to make charts chronological
    const sortedUsage = [...rawUsage].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Group by Date (YYYY-MM-DD)
    const dailyMap: Record<string, { prompt: number; completion: number; total: number }> = {};
    const modelMap: Record<string, { prompt: number; completion: number; total: number; count: number }> = {};
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    for (const entry of sortedUsage) {
      const dateStr = entry.createdAt.split('T')[0];
      
      // Daily aggregates
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { prompt: 0, completion: 0, total: 0 };
      }
      dailyMap[dateStr].prompt += entry.promptTokens;
      dailyMap[dateStr].completion += entry.completionTokens;
      dailyMap[dateStr].total += entry.totalTokens;

      // Model aggregates
      const model = entry.model || 'unknown';
      if (!modelMap[model]) {
        modelMap[model] = { prompt: 0, completion: 0, total: 0, count: 0 };
      }
      modelMap[model].prompt += entry.promptTokens;
      modelMap[model].completion += entry.completionTokens;
      modelMap[model].total += entry.totalTokens;
      modelMap[model].count += 1;

      // Global aggregates
      totalPromptTokens += entry.promptTokens;
      totalCompletionTokens += entry.completionTokens;
    }

    const dailyUsage = Object.entries(dailyMap).map(([date, stats]) => ({
      date,
      ...stats,
    }));

    const modelUsage = Object.entries(modelMap).map(([model, stats]) => ({
      model,
      ...stats,
    }));

    return NextResponse.json({
      summary: {
        totalPromptTokens,
        totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
        totalRequests: sortedUsage.length,
      },
      dailyUsage,
      modelUsage,
      recentUsage: sortedUsage.slice(-50).reverse(), // Last 50 entries, newest first
    });
  } catch (error) {
    console.error('Error fetching token stats:', error);
    return NextResponse.json({ error: 'Failed to fetch token statistics' }, { status: 500 });
  }
}
