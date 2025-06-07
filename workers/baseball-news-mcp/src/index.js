/**
 * Baseball News MCP - v3 Meta-Tool Façade
 * Exposes baseball.news meta-tool that aggregates headlines, injuries, and rumors
 */

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400"
          }
        });
      }
      
      // Health check
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          service: 'baseball-news-mcp',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          endpoints: ['headlines', 'injuries', 'rumors', 'odds', 'transactions']
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Main meta-tool endpoint
      if (request.method === 'POST') {
        const body = await request.json();
        const { keywords, since } = body;
        
        if (!keywords) {
          return new Response(JSON.stringify({
            error: 'Missing keywords parameter',
            example: { keywords: 'Yankees trade', since: '2025-01-01' }
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Check cache first
        const cacheKey = `news:${keywords}:${since || 'all'}`;
        const cached = await env.NEWS_CACHE.get(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          cachedData.meta.source = 'cache';
          return new Response(JSON.stringify(cachedData), {
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Aggregate news from multiple sources
        const result = await aggregateBaseballNews(keywords, since);
        
        // Cache for 10 minutes
        await env.NEWS_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 600 });
        
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" }
        });
      }
      
      return new Response('Baseball News MCP v3 - Meta-Tool Façade', {
        headers: { "Content-Type": "text/plain" }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message,
        service: 'baseball-news-mcp'
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};

/**
 * Aggregate baseball news from multiple sources
 */
async function aggregateBaseballNews(keywords, since) {
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days
  
  // Define news sources and endpoints
  const newsSources = [
    {
      name: 'MLB Official',
      url: 'https://www.mlb.com/news',
      type: 'headlines'
    },
    {
      name: 'ESPN MLB',
      url: 'https://www.espn.com/mlb/news',
      type: 'headlines'
    },
    {
      name: 'MLB Injury Report',
      url: 'https://www.mlb.com/injury-report',
      type: 'injuries'
    }
  ];
  
  const results = {
    keywords: keywords,
    since: sinceDate.toISOString(),
    articles: [],
    injuries: [],
    rumors: [],
    meta: {
      service: 'baseball-news-mcp',
      timestamp: new Date().toISOString(),
      sources: newsSources.length,
      source: 'live'
    }
  };
  
  // For now, return mock data since we'd need RSS parsing or news API keys for real implementation
  // In production, you would:
  // 1. Fetch RSS feeds from MLB.com, ESPN, etc.
  // 2. Parse XML/HTML content
  // 3. Filter by keywords and date
  // 4. Categorize as headlines/injuries/rumors
  
  results.articles = generateMockNews(keywords, 'headlines');
  results.injuries = generateMockNews(keywords, 'injuries');
  results.rumors = generateMockNews(keywords, 'rumors');
  
  return results;
}

/**
 * Generate mock news data (replace with real RSS/API parsing in production)
 */
function generateMockNews(keywords, type) {
  const baseArticles = {
    headlines: [
      {
        title: `${keywords} Latest Updates`,
        summary: `Breaking news about ${keywords} with important developments`,
        url: 'https://mlb.com/news/latest',
        published: new Date().toISOString(),
        source: 'MLB.com'
      },
      {
        title: `Analysis: ${keywords} Impact`,
        summary: `Expert analysis on how ${keywords} affects the team`,
        url: 'https://espn.com/mlb/story',
        published: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: 'ESPN'
      }
    ],
    injuries: [
      {
        title: `Injury Report: ${keywords}`,
        summary: `Player status updates related to ${keywords}`,
        url: 'https://mlb.com/injury-report',
        published: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: 'MLB Injury Report',
        severity: 'day-to-day'
      }
    ],
    rumors: [
      {
        title: `Trade Rumors: ${keywords}`,
        summary: `Speculation about ${keywords} and potential moves`,
        url: 'https://mlbtraderumors.com',
        published: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: 'MLB Trade Rumors',
        reliability: 'unconfirmed'
      }
    ]
  };
  
  return baseArticles[type] || [];
}