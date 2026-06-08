export const config = {
  // Run middleware on homepage and main entry routes
  matcher: ['/', '/accueil'],
};

export default function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  // Case-insensitive test for search engine spiders, social sharing crawlers, and embed tools
  const isBot = /facebook|twitter|linkedin|embed|quora|pinterest|slack|vk|whatsapp|opengraph|google|bot|fetch|axios|node|preview/i.test(userAgent);

  if (isBot) {
    // Rewrite the request URL to Vercel Serverless Function '/api/og'
    url.pathname = '/api/og';
    return new Response(null, {
      headers: {
        'x-middleware-rewrite': url.toString(),
      },
    });
  }
  
  // For normal users, let Vercel handle the request (serves index.html from static files)
  return;
}
