// Gera o portfólio em PDF a partir da página /portfolio-pdf/ do site já montado (_site).
// Uso: node ferramentas/gerar-pdf.mjs <pasta do site> <arquivo .pdf de saída>
// Sobe um servidor local temporário, abre a página no Chromium e imprime em A4.
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const [, , pastaSite = '_site', saida = 'assets/pdf/portfolio-lais-vieira.pdf'] = process.argv;
const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.otf': 'font/otf' };

const servidor = http.createServer((req, res) => {
  let caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (caminho.endsWith('/')) caminho += 'index.html';
  const raiz = path.resolve(pastaSite);
  const arquivo = path.resolve(raiz, '.' + caminho);
  if (!arquivo.startsWith(raiz + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(arquivo, (erro, dados) => {
    if (erro) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': tipos[path.extname(arquivo).toLowerCase()] || 'application/octet-stream' }).end(dados);
  });
});
await new Promise((ok) => servidor.listen(0, ok));
const porta = servidor.address().port;

const navegador = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const pagina = await navegador.newPage();
// Em ambientes sem internet, o script do QR code pode vir de um arquivo local.
if (process.env.QR_LOCAL) {
  await pagina.route(/cdnjs\.cloudflare\.com/, (r) => r.fulfill({ path: process.env.QR_LOCAL, contentType: 'text/javascript' }));
}
await pagina.goto(`http://localhost:${porta}/portfolio-pdf/`, { waitUntil: 'networkidle' });
await pagina.waitForFunction(() => document.documentElement.classList.contains('pronto'));
await pagina.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((ok) => { i.onload = i.onerror = ok; }))));
});
const quebradas = await pagina.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src));
if (quebradas.length) console.warn('Imagens que não carregaram:', quebradas);

fs.mkdirSync(path.dirname(saida), { recursive: true });
await pagina.pdf({ path: saida, preferCSSPageSize: true, printBackground: true });
const paginas = await pagina.evaluate(() => document.querySelectorAll('.pagina').length);
console.log(`PDF gerado: ${saida} (${paginas} páginas, ${(fs.statSync(saida).size / 1048576).toFixed(1)} MB)`);
await navegador.close();
servidor.close();
