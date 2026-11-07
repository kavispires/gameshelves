// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { expect, it } from 'vitest';

it('resolves public asset links under the deployment base exactly once after Vite transforms HTML', async () => {
  const server = await createServer({
    configFile: false,
    base: '/gameshelves/',
    server: { middlewareMode: true, watch: null },
    logLevel: 'silent',
  });
  try {
    const source = await readFile('index.html', 'utf8');
    const html = await server.transformIndexHtml('/gameshelves/', source, '/gameshelves/');
    const manifestHref = html.match(/<link[^>]*rel="manifest"[^>]*href="([^"]+)"/)?.[1];
    expect(manifestHref).toBe('/gameshelves/manifest.json');
    const publicLinks = [...html.matchAll(/<link[^>]*href="([^"]+)"/g)].map((match) => match[1]);
    expect(publicLinks.length).toBeGreaterThan(0);
    for (const href of publicLinks) {
      expect(href).toMatch(/^\/gameshelves\/[^/]+$/);
    }
  } finally {
    await server.close();
  }
});
