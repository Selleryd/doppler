import pages from './generated-pages.json';
export function servePage(request:Request) {
 const raw = new URL(request.url).pathname;
 const key = raw === '/' ? '/' : raw.endsWith('/') ? raw : raw+'/';
 if (key === '/office/' && (!request.headers.get('oai-authenticated-user-id') || !request.headers.get('oai-authenticated-user-email'))) {
  return new Response(null, {status:302,headers:{Location:'/signin-with-chatgpt?return_to=%2Foffice%2F','Cache-Control':'private, no-store'}});
 }
 const html = (pages as Record<string,string>)[key] || (pages as Record<string,string>)[raw];
 return new Response(html || (pages as Record<string,string>)['/404.html'], {status:html?200:404,headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':'no-store'}});
}
