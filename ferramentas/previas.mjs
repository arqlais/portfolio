// Tira os prints de prévia (celular, tablet e computador) do site, do portfólio em PDF e do painel.
// Uso: npm ci && jekyll build && node ferramentas/previas.mjs [site|pdf|painel|tudo] [pasta de saída] [seções do painel...]
// Ex.: node ferramentas/previas.mjs painel previas pdf-capa portfolio
// O painel abre com um GitHub de mentira (lê os arquivos deste repositório): nada é salvo de verdade.
import { chromium, devices } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const [, , alvo = 'tudo', saida = 'previas', ...secoesPainel] = process.argv;
const RAIZ = process.cwd();
const SITE = path.join(RAIZ, '_site');
if (!fs.existsSync(SITE)) { console.error('Monte o site antes: jekyll build'); process.exit(1); }
fs.mkdirSync(saida, { recursive: true });

const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.otf': 'font/otf', '.pdf': 'application/pdf' };
const servidor = http.createServer((req, res) => {
  let caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (caminho.endsWith('/')) caminho += 'index.html';
  const arquivo = path.resolve(SITE, '.' + caminho);
  if (!arquivo.startsWith(SITE + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(arquivo, (erro, dados) => {
    if (erro) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': tipos[path.extname(arquivo).toLowerCase()] || 'application/octet-stream' }).end(dados);
  });
});
await new Promise((ok) => servidor.listen(0, ok));
const BASE = `http://localhost:${servidor.address().port}`;

const DISPOSITIVOS = {
  celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent },
  tablet: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPad (gen 7)'].userAgent },
  computador: { viewport: { width: 1440, height: 900 } },
};
// Usa o Chromium que o Playwright instalou; se não houver, o do sistema (ou o de CHROMIUM_PATH).
const caminhoChromium = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const navegador = await chromium.launch(caminhoChromium ? { executablePath: caminhoChromium } : {}).catch(() => chromium.launch());
const erros = [];

// Página inteira: rola até o fim (carrega as imagens e as animações de entrada) e fotografa com a altura toda.
async function paginaInteira(pagina, arquivo) {
  await pagina.addStyleTag({ content: '.reveal,.reveal-stagger>*{opacity:1!important;transform:none!important}' });
  const altura = await pagina.evaluate(async () => {
    const fim = document.documentElement.scrollHeight;
    for (let y = 0; y < fim; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
    scrollTo(0, 0);
    return document.documentElement.scrollHeight;
  });
  const largura = pagina.viewportSize().width;
  await pagina.setViewportSize({ width: largura, height: Math.min(altura, 16000) });
  // Com a página toda na tela, as imagens "lazy" carregam; espera no máximo 10 s.
  await pagina.evaluate(() => Promise.race([
    Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((ok) => { i.onload = i.onerror = ok; })))),
    new Promise((ok) => setTimeout(ok, 10000)),
  ]));
  await pagina.waitForTimeout(400);
  await pagina.screenshot({ path: arquivo });
}

async function site() {
  for (const [nome, opcoes] of Object.entries(DISPOSITIVOS)) {
    const ctx = await navegador.newContext({ locale: 'pt-BR', ...opcoes });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => erros.push(`site/${nome}: ${e.message}`));
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    await paginaInteira(p, path.join(saida, `site-${nome}.png`));
    await ctx.close();
  }
}

async function pdf() {
  const ctx = await navegador.newContext({ viewport: { width: 1080, height: 1400 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => erros.push(`pdf: ${e.message}`));
  await p.goto(BASE + '/portfolio-pdf/', { waitUntil: 'networkidle' });
  await p.waitForFunction(() => document.documentElement.classList.contains('pronto'));
  await paginaInteira(p, path.join(saida, 'portfolio-pdf.png'));
  await ctx.close();
}

// GitHub de mentira para o painel: devolve os arquivos deste repositório e aceita salvar sem mandar nada.
async function githubFalso(ctx) {
  const ler = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8');
  // Bibliotecas do painel (js-yaml e Sortable) vêm do cdnjs; sem internet, usa as cópias do node_modules.
  const locais = { 'js-yaml': 'node_modules/js-yaml/dist/js-yaml.min.js', Sortable: 'node_modules/sortablejs/Sortable.min.js' };
  await ctx.route(/cdnjs\.cloudflare\.com/, async (r) => {
    const nome = Object.keys(locais).find((n) => r.request().url().includes(`/${n}/`));
    if (nome && fs.existsSync(path.join(RAIZ, locais[nome]))) {
      return r.fulfill({ path: path.join(RAIZ, locais[nome]), contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } });
    }
    return r.continue();
  });
  await ctx.route(/api\.github\.com/, async (r) => {
    const url = new URL(r.request().url());
    const caminho = url.pathname.replace(/^\/repos\/[^/]+\/[^/]+/, '');
    const json = (o, status = 200) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(o), headers: { 'access-control-allow-origin': '*' } });
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (caminho === '') return json({ permissions: { push: true } });
    if (caminho.startsWith('/git/ref/')) return json({ object: { sha: 'local' } });
    if (caminho === '/contents/_includes') return json(fs.readdirSync(path.join(RAIZ, '_includes')).map((name) => ({ name, type: 'file' })));
    const conteudo = caminho.match(/^\/contents\/(.+)$/);
    if (conteudo) {
      try { return r.fulfill({ status: 200, contentType: 'text/plain', body: ler(decodeURIComponent(conteudo[1])), headers: { 'access-control-allow-origin': '*' } }); }
      catch { return json({ message: 'Not Found' }, 404); }
    }
    if (caminho.startsWith('/git/trees/')) {
      const lista = execSync('git ls-files assets/img', { cwd: RAIZ }).toString().trim().split('\n');
      return json({ tree: lista.map((p) => ({ path: p, type: 'blob' })) });
    }
    if (caminho === '/commits') return json([]);
    return json({ sha: 'local', object: { sha: 'local' }, tree: { sha: 'local' } });
  });
}

async function painel() {
  const secoes = secoesPainel.length ? secoesPainel : ['inicio', 'portfolio', 'projetos', 'pdf-capa', 'pdf-trabalhos', 'pdf-final', 'pdf-paginas'];
  for (const nome of ['computador', 'celular']) {
    const ctx = await navegador.newContext({ locale: 'pt-BR', ...DISPOSITIVOS[nome] });
    await githubFalso(ctx);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => erros.push(`painel/${nome}: ${e.message}`));
    p.on('dialog', (d) => d.accept());
    await p.goto(BASE + '/admin/', { waitUntil: 'networkidle' });
    await p.fill('#campo-token', 'github_pat_previa');
    await p.click('#form-entrada button');
    await p.waitForTimeout(2000);
    for (const secao of secoes) {
      await p.goto(`${BASE}/admin/#${secao}`);
      await p.waitForTimeout(1800);
      await p.screenshot({ path: path.join(saida, `painel-${nome}-${secao}.png`) });
    }
    await ctx.close();
  }
}

if (alvo === 'site' || alvo === 'tudo') await site();
if (alvo === 'pdf' || alvo === 'tudo') await pdf();
if (alvo === 'painel' || alvo === 'tudo') await painel();
await navegador.close();
servidor.close();
console.log(`Prévias em ${path.resolve(saida)}:`);
for (const f of fs.readdirSync(saida).sort()) console.log('  ' + f);
console.log(erros.length ? 'Erros nas páginas:\n  ' + erros.join('\n  ') : 'Nenhum erro nas páginas.');
