
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  const apiKey =
    process.env.ANA_SEARCH_API_KEY ||
    process.env.GOOGLE_SEARCH_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    return NextResponse.json(
      { error: 'Server is not configured for web search. Missing API key or search engine ID.' },
      { status: 500 }
    );
  }

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Search API error:', errorData);
      return NextResponse.json(
        { error: `Failed to fetch search results: ${errorData.error.message}` },
        { status: response.status }
      );
    }
    const data = await response.json();
    
    // Extract relevant information (snippets) from the search results
    const snippets = data.items?.map((item: any) => item.snippet).filter(Boolean) || [];

    return NextResponse.json({ results: snippets });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
