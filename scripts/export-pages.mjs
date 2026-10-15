import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const LOCAL_ORIGIN = 'https://doppler-export.invalid';
const DEFAULT_LEAD_ENDPOINT = 'https://doppler-wellness-reimagined.sellery.chatgpt.site/api/leads';

export function normalizeBase(base = '/doppler/') {
  if (!base.startsWith('/') || base.startsWith('//') || /[?#\\]/.test(base)) throw new Error('The Pages base must be a local absolute path.');
  const normalized = new URL(base, LOCAL_ORIGIN).pathname;
  if (normalized !== base || base.includes('//')) throw new Error('The Pages base must not contain traversal or repeated separators.');
  return base.endsWith('/') ? base : `${base}/`;
}

export function rewriteLocalUrl(value, route, base) {
  if (!value || value.startsWith('#') || value.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(value)) return value;
  const url = new URL(value, `${LOCAL_ORIGIN}${route}`);
  return `${base}${url.pathname.replace(/^\//, '')}${url.search}${url.hash}`;
}

export function rewriteCss(css, route, base) {
  return css.replace(/url\(\s*(?:(["'])([\s\S]*?)\1|([^"')]*?))\s*\)/gi, (match, quote, quoted, plain) => {
    const value = (quoted ?? plain).trim();
    const rewritten = rewriteLocalUrl(value, route, base);
    return rewritten === value ? match : `url(${quote || ''}${rewritten}${quote || ''})`;
  });
}

export function rewriteSrcset(srcset, route, base) {
  const candidates = [];
  let cursor = 0;
  while (cursor < srcset.length) {
    while (/[\s,]/.test(srcset[cursor] || '') && cursor < srcset.length) cursor++;
    if (cursor >= srcset.length) break;
    const start = cursor;
    while (cursor < srcset.length && !/\s/.test(srcset[cursor])) cursor++;
    let url = srcset.slice(start, cursor);
    let descriptor = '';
    if (url.endsWith(',')) url = url.replace(/,+$/, '');
    else {
      const descriptorStart = cursor;
      let parentheses = 0;
      while (cursor < srcset.length) {
        const char = srcset[cursor];
        if (char === '(') parentheses++;
        if (char === ')') parentheses--;
        if (char === ',' && !parentheses) break;
        cursor++;
      }
      descriptor = srcset.slice(descriptorStart, cursor).trim();
      if (srcset[cursor] === ',') cursor++;
    }
    candidates.push(`${rewriteLocalUrl(url, route, base)}${descriptor ? ` ${descriptor}` : ''}`);
  }
  return candidates.join(', ');
}

const escapeAttribute = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

export function rewriteHtml(html, route, { base, leadEndpoint }) {
  let output = html.replace(/(?<![\w:-])(href|xlink:href|src|srcset|action|poster)\s*=\s*(["'])([\s\S]*?)\2/gi, (match, attr, quote, value) => {
    const target = attr.toLowerCase() === 'srcset'
      ? rewriteSrcset(value, route, base)
      : attr.toLowerCase() === 'action' && new URL(value, `${LOCAL_ORIGIN}${route}`).origin === LOCAL_ORIGIN && new URL(value, `${LOCAL_ORIGIN}${route}`).pathname === '/api/leads'
        ? leadEndpoint
        : rewriteLocalUrl(value, route, base);
    return `${attr}=${quote}${target}${quote}`;
  });
  output = rewriteCss(output, route, base);
  output = output.replace(/<meta\b(?=[^>]*\bname\s*=\s*(["'])doppler-lead-endpoint\1)[^>]*>/gi, '');
  return output.replace(/<\/head>/i, `<meta name="doppler-lead-endpoint" content="${escapeAttribute(leadEndpoint)}"></head>`);
}

function outputPath(route) {
  if (!route.startsWith('/') || route.startsWith('//') || /[\\?#\0]/.test(route) || new URL(route, LOCAL_ORIGIN).pathname !== route) throw new Error(`Invalid generated route: ${route}`);
  return route === '/' ? 'index.html' : route.endsWith('/') ? `${route.slice(1)}index.html` : route.slice(1);
}

function officeRedirect(officeUrl) {
  const url = escapeAttribute(officeUrl);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=${url}"><title>Doppler office</title><link rel="canonical" href="${url}"></head><body><p><a href="${url}">Continue to the Doppler office</a></p></body></html>`;
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
    else throw new Error(`Public export does not accept symbolic links: ${path}`);
  }
  return files;
}

export async function exportPages({ root = process.cwd(), output = '/workspace/doppler-pages-v41', base = '/doppler/', leadEndpoint = DEFAULT_LEAD_ENDPOINT } = {}) {
  root = resolve(root);
  output = resolve(output);
  base = normalizeBase(base);
  const endpoint = new URL(leadEndpoint);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.hash || endpoint.search) throw new Error('Use an HTTPS lead endpoint without credentials, query or fragment.');
  const rootFromOutput = relative(output, root);
  const outputFromRoot = relative(root, output);
  const isWithin = path => !path || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path));
  if (isWithin(rootFromOutput) || isWithin(outputFromRoot)) throw new Error('The clean export directory must not contain the project or replace project files.');
  const publicRoot = join(root, 'public');
  const pages = JSON.parse(await readFile(join(root, 'src/generated-pages.json'), 'utf8'));
  for (const route of Object.keys(pages)) outputPath(route);
  // Validate the source tree before recursive copying, including files we do not transform.
  await walk(publicRoot);
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(publicRoot, output, { recursive: true });
  for (const file of await walk(output)) {
    const route = `/${relative(output, file).split(sep).join('/')}`;
    if (file.endsWith('.css')) await writeFile(file, rewriteCss(await readFile(file, 'utf8'), route, base));
    if (file.endsWith('.html')) await writeFile(file, rewriteHtml(await readFile(file, 'utf8'), route, { base, leadEndpoint }));
  }
  const officeUrl = new URL('/office/', endpoint.origin).href;
  for (const [route, html] of Object.entries(pages)) {
    const destination = join(output, outputPath(route));
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, route === '/office/' ? officeRedirect(officeUrl) : rewriteHtml(html, route, { base, leadEndpoint }));
  }
  const manifestPath = join(output, 'site.webmanifest');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.start_url = rewriteLocalUrl(manifest.start_url || '/', '/', base);
  manifest.scope = base;
  for (const icon of manifest.icons || []) icon.src = rewriteLocalUrl(icon.src, '/site.webmanifest', base);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(join(output, '.nojekyll'), '');
  return { output, base, leadEndpoint, officeUrl, routes: Object.keys(pages).length, articles: Object.keys(pages).filter(route => route.startsWith('/blogs/news/') && route !== '/blogs/news/').length, files: (await walk(output)).length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--root', '--output', '--base', '--lead-endpoint'].includes(args[i]) || !args[i + 1]) throw new Error('Usage: node scripts/export-pages.mjs [--root PATH] [--output PATH] [--base /doppler/] [--lead-endpoint HTTPS_URL]');
    options[args[i] === '--lead-endpoint' ? 'leadEndpoint' : args[i].slice(2)] = args[i + 1];
  }
  console.log(JSON.stringify(await exportPages(options)));
}
