# Portfólio da Laís — instruções para o Claude

Este arquivo é lido automaticamente pelo Claude Code em toda sessão neste repositório, em qualquer conta.
Ele guarda o contexto do projeto e o jeito de trabalhar combinado com a Laís, para continuar de onde parou.

## Quem é e como falar
- Laís Vieira: estudante de Arquitetura e Urbanismo, designer gráfica, faz renderização (V-Ray e IA), modelagem 3D,
  detalhamento e projeto executivo. Site: **www.lais3d.com.br** (este repositório, `arqlais/portfolio`).
- Responda **sempre em português do Brasil**, simples e direto, sem termos técnicos (ela não é programadora).
- Ela escreve rápido e informal ("q", "tb", "n"): entenda a intenção e siga sem fazer muitas perguntas.
  "faça tudo que achar melhor" / "infere absolutamente tudo" = decida e execute.

## Jeito de trabalhar (combinado com ela)
1. **Ela não mexe em código.** Você faz tudo: edita, faz commit, push, abre o PR e **faz o merge você mesmo**
   (squash) pelas ferramentas do GitHub. Nada de pedir para ela rodar comandos.
2. **Sempre mande prévias (prints)** de cada mudança: **celular, tablet e computador** do site, a folha inteira do
   PDF e as telas do painel (computador e celular). Use `ferramentas/previas.mjs` (abaixo) e envie os arquivos.
3. Tudo **alinhado, organizado, profissional e na identidade visual do site** (seção "Identidade"). Nada amador.
4. **Nunca mostrar carimbo, dados de cliente nem margem sobrando** nas imagens (pranchas, estudos de caso, PDF).
5. **Não mexer nos recortes/enquadramentos do site** sem ela pedir: ela aprovou como estão.
6. O token do painel é segredo dela: nunca peça, nunca mostre, nunca coloque em arquivo.
7. Antes de abrir PR: `git fetch origin main` e junte a `main` (a Action do PDF faz commits sozinha).
   Conflito em `assets/pdf/*`: fique com qualquer lado, a Action gera o PDF de novo depois do merge.
8. Depois do merge, confira a Action "Gerar portfólio em PDF" e o "pages build and deployment".

## Como o site funciona
- **Jekyll no GitHub Pages** (deploy direto da `main`, domínio em `CNAME`). Não há build próprio: o Pages monta.
- **Todo texto e imagem fica em `_data/*.yml`**; `index.html` e `_includes/` só desenham.
  - `inicio`, `portfolio` (renders; `tipo: vray|ia`; `pdf: nao` tira do PDF), `comparar` (print × IA),
    `projetos` (estudos de caso; `texto_servico` é a descrição usada no PDF), `servicos`, `para_quem`,
    `como_funciona`, `sobre_mim`, `contato`, `cores`, `geral` (nome, WhatsApp, e-mail, Instagram).
  - `pdf.yml` = portfólio em PDF · `orcamento.yml` = orçamento de render · `moradores.yml` = proposta para moradores.
  - Texto entre `*asteriscos*` num título vira a palavra em letra cursiva (`_includes/destaque.html`).
  - Enquadramento de foto: `enquadramento: {x, y, zoom}` → variáveis `--fx/--fy/--fz` (`_includes/enquadramento.html`).
- **Painel `/admin`** (só ela entra, com token do GitHub de permissão fina no repositório):
  JavaScript puro em `admin/painel.js` + `admin/painel.css`. Lê e grava os `_data/*.yml` pela API do GitHub
  (blobs → tree → commit → ref). As seções do painel ficam na lista `SECOES` em `painel.js`
  (aba site, "portfólio em PDF", "orçamento (PDF)", "proposta moradores (PDF)"). Tem prévia ao vivo com liquidjs
  (`admin/vendor`), biblioteca de imagens, histórico, desfazer/refazer, arrastar para reordenar (SortableJS) e
  enquadramento de fotos — tudo precisa funcionar bem **no celular**.
  Ao criar campo novo no YAML, crie também o campo no painel.
- `admin/orcamento/` e `admin/moradores/`: PDFs de orçamento e proposta montados no navegador a partir do painel.
- `/prompt/` é gerado pelo repositório `arqlais/prompt` (script de lá). **Não edite aqui**: edite lá.
- `versao.json` e `assets/pdf/info.json`: o painel usa para saber quando a publicação terminou.

## Portfólio em PDF (`portfolio-pdf.html` + `assets/css/pdf.css` + `_data/pdf.yml`)
- **Folha única, 1080 px de largura**, altura conforme o conteúdo. Página em `/portfolio-pdf/`.
- A Action `.github/workflows/pdf.yml` (runner fixo `ubuntu-24.04`) gera `assets/pdf/portfolio-lais-vieira.pdf`
  com `ferramentas/gerar-pdf.mjs` a cada push na `main` que mexe em conteúdo, faz commit como
  github-actions[bot] e pede um novo build do Pages.
- Ordem atual: topo ("portfólio *laís*") → foto em arco + "muito prazer!" + botões **pedir orçamento de render**
  (WhatsApp com mensagem pronta) e abrir o site → 3 selos → faixa rosa → números → serviços →
  15 renders 4:5 **intercalando V-Ray e IA** + cartão "+N renders no site" → **print × IA** (3 comparações
  inteiras, sem corte) → **estudos de caso "do papel à entrega técnica"** (imagem e texto lado a lado, descrição
  e ficha; é a parte mais importante, mostra o que ela faz) → como funciona + softwares → fechamento azul.
- Histórico do que ela pediu: nada de "resumido demais" nem "comprido e cansativo"; lado a lado, poucas listas;
  seguir o site e o PDF de orçamento; sem sombras que viram retângulos cinza no iPhone.

## Identidade visual (igual ao site, `assets/css/style.css`)
- Cores: creme `#f5f2ee`, azul-petróleo `#3e4d59`/`#4b5e6c`, rosé `#d1ada4`, rosé escuro `#ab8e86`,
  rosé claro `#e1cac4`, rosé bem claro `#eee0dc`, texto `#334049`, cinza `#86929a`, linha `#e0dbce`.
- Fontes: **Poppins** (títulos em 600–700) + **The Seasons** itálico só na palavra em destaque.
  Chamadas pequenas com tracinho antes (`.eyebrow`), em rosé escuro.
- Faixa rosa: fundo rosé claro com **linha em cima e embaixo em rosé mais escuro**, itens separados por ✦.
- Cantos arredondados (cartões 18 px, botões em pílula), foto de perfil em arco, blocos finais em azul-petróleo.

## Comandos (rodar e conferir antes de mandar)
```bash
gem install jekyll -v 4.4.1 --no-document   # se não tiver
npm ci                                      # playwright + cópias locais do js-yaml e do Sortable
jekyll build                                # monta em _site/
node ferramentas/gerar-pdf.mjs _site /tmp/portfolio.pdf          # gera o PDF localmente
node ferramentas/previas.mjs tudo previas                        # prints: site, PDF e painel
node ferramentas/previas.mjs painel previas pdf-capa portfolio   # só algumas seções do painel
```
- Nas sessões na nuvem o Chromium já vem em `/opt/pw-browsers/chromium` (o script usa sozinho; não rode
  `playwright install`). O cdnjs e o próprio site podem estar bloqueados pela rede: o script de prévias usa as
  cópias do `node_modules` e um GitHub de mentira para abrir o painel sem token.
- Não deixe `previas/`, `_site/` nem `node_modules/` no commit.
