import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';
import { articlesA } from '../src/articles-a.mjs';
import { articlesB } from '../src/articles-b.mjs';
import { legacyArticles } from '../src/articles-legacy.mjs';

// Validate the generated site, rather than a second implementation of its catalog.
const articles = [...articlesA, ...articlesB, ...legacyArticles];
const pages = JSON.parse(readFileSync(new URL('../src/generated-pages.json', import.meta.url), 'utf8'));
const journal = pages['/blogs/news/'];
const plain = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const cardTags = [...journal.matchAll(/<a\b[^>]*data-journal-card[^>]*>/g)].map(match => match[0]);
const attribute = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

test('the complete journal exposes all twelve original and long-form articles', () => {
  assert.equal(articles.length, 12);
  assert.equal(cardTags.length, articles.length);
  const hrefs = cardTags.map(tag => attribute(tag, 'href'));
  assert.equal(new Set(hrefs).size, articles.length);
  for (const article of articles) {
    const path = `/blogs/news/${article.slug}/`;
    assert(hrefs.includes(path), `Missing index card for ${article.slug}`);
    assert(pages[path], `Missing article route ${path}`);
    assert(journal.includes(article.title), `Missing title for ${article.slug}`);
  }
});

test('all article routes retain their full bodies, headings, and responsive artwork', () => {
  for (const article of articles) {
    const html = pages[`/blogs/news/${article.slug}/`];
    assert(html.includes(`<h1>${article.title}</h1>`));
    const prose = html.split('<div class="article-prose" id="article-body">')[1]?.split('<div class="article-note">')[0];
    assert(prose, `Missing prose for ${article.slug}`);
    const original = article.body || article.content;
    const paragraphs = [...original.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(match => plain(match[1]));
    assert.equal((prose.match(/<p>/g) || []).length, paragraphs.length, `Truncated paragraphs in ${article.slug}`);
    assert(plain(prose).includes(paragraphs[0]), `Missing opening in ${article.slug}`);
    assert(plain(prose).includes(paragraphs.at(-1)), `Missing ending in ${article.slug}`);
    for (const heading of original.matchAll(/<h2>([\s\S]*?)<\/h2>/g)) {
      assert(plain(prose).includes(plain(heading[1])), `Missing section in ${article.slug}`);
    }
    for (const src of html.matchAll(/(?:src|srcset)="([^\"]+)"/g)) {
      for (const url of src[1].split(',').map(part => part.trim().split(' ')[0])) {
        if (url.startsWith('/assets/')) assert(existsSync(new URL(`../public${url}`, import.meta.url)), `Missing artwork ${url}`);
      }
    }
    assert(!html.match(/<header class="article-hero">[\s\S]*?<\/header>/)?.[0].includes('data-reveal'));
  }
});

test('article links remain navigable from both slash and non-slash journal aliases', () => {
  for (const base of ['https://example.test/blogs/news', 'https://example.test/blogs/news/']) {
    for (const tag of cardTags) {
      const path = new URL(attribute(tag, 'href'), base).pathname;
      assert(pages[path], `${base} resolves a card to absent route ${path}`);
    }
  }
  for (const article of articles) {
    const html = pages[`/blogs/news/${article.slug}/`];
    const links = [...html.matchAll(/href="(\/blogs\/news\/[^\"]*)"/g)].map(match => match[1]);
    assert(links.includes('/blogs/news/'));
    assert(links.filter(href => href !== '/blogs/news/').length >= 3);
    for (const suffix of ['', '/']) {
      const base = `https://example.test/blogs/news/${article.slug}${suffix}`;
      for (const href of links) assert(pages[new URL(href, base).pathname]);
    }
  }
});

test('every topic filter works for the complete catalog and All restores all articles', () => {
  const filters = [...journal.matchAll(/<button\b[^>]*data-journal-filter[^>]*>/g)].map(match => attribute(match[0], 'data-journal-filter'));
  assert.deepEqual(new Set(filters), new Set(['all', ...articles.map(article => article.category)]));
  const cards = cardTags.map(tag => ({ dataset: { category: attribute(tag, 'data-category') }, hidden: false }));
  const buttons = filters.map(filter => ({
    dataset: { journalFilter: filter }, pressed: filter === 'all',
    setAttribute(name, value) { if (name === 'aria-pressed') this.pressed = value === 'true'; },
    addEventListener(name, handler) { if (name === 'click') this.click = handler; }
  }));
  const source = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const start = source.indexOf('const journalFilters =');
  const end = source.indexOf("all('[data-year]')", start);
  vm.runInNewContext(source.slice(start, end), { all: selector => selector === '[data-journal-filter]' ? buttons : cards });
  for (const button of buttons) {
    button.click();
    const expected = button.dataset.journalFilter === 'all' ? articles.length : articles.filter(article => article.category === button.dataset.journalFilter).length;
    assert.equal(cards.filter(card => !card.hidden).length, expected);
    assert.equal(buttons.filter(item => item.pressed).length, 1);
  }
  buttons[0].click();
  assert(cards.every(card => !card.hidden));
  assert(!cardTags.some(tag => tag.includes('data-reveal')), 'Essential index cards must be readable without animation initialization');
});
