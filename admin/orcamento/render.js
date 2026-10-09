/* Orçamento de renderização — desenha a página a partir dos dados de _data/orcamento.yml.
 * Usado pelo painel (pré-visualização) e por pdf.html (salvar em PDF). */
(() => {
  'use strict';

  const ICONES = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    cube: '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4"/>',
    home: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    angles: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/>',
    trend: '<path d="M22 17l-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    msg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-9 5.7a2 2 0 0 1-2 0L2 7"/>',
    insta: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h6"/><path d="M9 13h6M9 17h6"/>',
    minus: '<path d="M6 12h12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
  };

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // **negrito** e *itálico* dentro de um texto
  const inline = (v) => esc(v).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  // parágrafos separados por linha em branco
  const paragrafos = (v) => String(v ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${inline(p).replace(/\n/g, '<br>')}</p>`).join('');
  // títulos: o trecho entre *asteriscos* sai em letra cursiva
  const titulo = (v) => esc(v).split('*').map((p, i) => (i % 2 ? `<span class="script">${p}</span>` : p)).join('');
  const ic = (nome) => `<svg class="i"><use href="#oi-${esc(nome)}"/></svg>`;
  const lista = (v) => (Array.isArray(v) ? v : []);
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const reais = (v) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  const enq = (e) => (e && (e.x != null || e.y != null || e.zoom != null)
    ? ` style="--fx:${num(e.x ?? 50)}%;--fy:${num(e.y ?? 50)}%;--fz:${num(e.zoom ?? 1)}"` : '');

  const sprite = () => '<svg width="0" height="0" style="position:absolute" aria-hidden="true">'
    + Object.entries(ICONES).map(([n, p]) => `<symbol id="oi-${n}" viewBox="0 0 24 24">${p}</symbol>`).join('') + '</svg>';

  /** o = dados do orçamento; foto(caminho) = endereço da imagem (fotos novas ainda não salvas). */
  window.renderOrcamento = (o, foto = (c) => c) => {
    o = o || {};
    const wa = `https://api.whatsapp.com/send?phone=${encodeURIComponent(o.whatsapp_numero || '')}`;
    const insta = `https://www.instagram.com/${encodeURIComponent(o.instagram_usuario || '')}`;
    const img = (c) => esc(foto(c || ''));

    const pacotes = lista(o.pacotes);
    const base = pacotes[0] || { quantidade: 1, vray: 0, ia: 0 };
    const unidBase = { vray: num(base.vray) / (num(base.quantidade) || 1), ia: num(base.ia) / (num(base.quantidade) || 1) };
    const unidMax = Math.max(unidBase.vray, unidBase.ia) || 1;

    const metodos = lista(o.metodos).map((m) => `
      <article class="m">
        <img src="${img(m.imagem)}"${enq(m.enquadramento)} alt="">
        <div class="m-t"><small>${esc(m.rotulo)}</small><h3>${esc(m.nome)}${String(m.destaque || '').trim() ? ` <span class="pilula">${esc(m.destaque)}</span>` : ''}</h3></div>
        <p class="d">${inline(m.descricao)}</p>
        <div class="medidores">${lista(m.medidores).map((md) => `
          <div class="medidor">${ic(md.icone)}<span>${esc(md.nome)}</span><span class="pontos">${[1, 2, 3, 4, 5].map((n) => `<i${n <= num(md.nota) ? ' class="on"' : ''}></i>`).join('')}</span></div>`).join('')}
        </div>
        <div class="ideal"><h4>${esc(o.ideal_rotulo)}</h4><ul>${lista(m.ideal).map((it) => `
          <li><span class="ic">${ic(it.icone)}</span>${esc(it.texto)}</li>`).join('')}
        </ul></div>
        <div class="ponto"><span class="ic">${ic(m.ponto_icone)}</span><p><b>${esc(m.ponto_titulo)}</b>${esc(m.ponto_texto)}</p></div>
      </article>`).join('');

    const celula = (txt, det, vence) => `<div class="cel${vence === 'sim' ? ' vence' : ''}">${vence === 'sim' ? ic('check') : ic('minus')}<span>${esc(txt)}${String(det || '').trim() ? `<small>${esc(det)}</small>` : ''}</span></div>`;
    const comparativo = lista(o.comparativo).map((c) => `
      <div class="cmp-r"><div class="crit">${ic(c.icone)}${esc(c.criterio)}</div>${celula(c.vray, c.vray_detalhe, c.vray_vantagem)}${celula(c.ia, c.ia_detalhe, c.ia_vantagem)}</div>`).join('');

    const tabelaPrecos = (col, nome) => `
      <div class="pt">
        <div class="pt-h"><h3>${esc(nome)}</h3><small>${ic('trend')}${esc(o.valores_rotulo_por_imagem)}</small></div>
        ${pacotes.map((p) => {
          const q = num(p.quantidade) || 1;
          const total = num(p[col]);
          const unid = total / q;
          const economia = Math.round(unidBase[col] * q - total);
          const quente = p.mais_pedido === col || p.mais_pedido === 'ambos';
          return `<div class="linha${quente ? ' quente' : ''}">
            ${quente ? `<span class="selo">${ic('star')}${esc(o.selo_mais_pedido)}</span>` : ''}
            <div class="q">${String(q).padStart(2, '0')}<small>${q === 1 ? 'imagem' : 'imagens'}</small></div>
            <div class="por">${reais(unid)} / imagem<div class="trilho"><i style="width:${Math.min(100, (unid / unidMax) * 100).toFixed(1)}%"></i></div></div>
            <div class="tot">${reais(total)}${economia > 0 ? `<small>economia ${reais(economia)}</small>` : ''}</div>
          </div>`;
        }).join('')}
      </div>`;

    const tipo = (t) => (t === 'ia'
      ? `<em class="tipo ia">${ic('spark')}IA</em>`
      : `<em class="tipo">${ic('cube')}V-RAY</em>`);

    const itensIcone = (itens) => lista(itens).map((i) => `<li><span class="ic">${ic(i.icone)}</span><p>${inline(i.texto)}</p></li>`).join('');

    const escala = (v) => (num(v) > 0 ? num(v) / 100 : 1);
    const estilo = `--t:${escala(o.tamanho_textos)};--h:${escala(o.tamanho_titulos)};--s:${escala(o.tamanho_saudacao)}`;

    return `<div class="orcamento" style="${estilo}">${sprite()}
<div class="barra"><span>${esc(o.topo_esquerda)}</span><span>${esc(o.topo_direita)}</span></div>
<header class="hero wrap">
  <img class="foto" src="${img(o.foto)}"${enq(o.foto_enquadramento)} alt="${esc(o.foto_alt)}">
  <div class="hero-texto"><h1>${esc(o.saudacao)}</h1>${paragrafos(o.apresentacao)}
    <div class="chips">${lista(o.ferramentas).map((f) => `<span>${esc(f)}</span>`).join('')}</div>
  </div>
</header>
<div class="creds wrap">${lista(o.credenciais).map((c) => (typeof c === 'string' ? { icone: 'check', titulo: c } : c)).map((c) => `
  <div class="selo-cred"><span class="ic">${ic(c.icone)}</span><p><b>${esc(c.titulo)}</b>${String(c.texto || '').trim() ? esc(c.texto) : ''}</p></div>`).join('')}
</div>

<section class="sec"><div class="wrap">
  <div class="head"><span class="eyebrow">${esc(o.metodos_chamada)}</span><h2>${titulo(o.metodos_titulo)}</h2><p>${esc(o.metodos_texto)}</p></div>
  <div class="metodos">${metodos}</div>
  <div class="cmp">
    <div class="cmp-r cab"><div>${esc(o.comparativo_rotulo)}</div><div>${esc(o.comparativo_coluna_1)}</div><div>${esc(o.comparativo_coluna_2)}</div></div>${comparativo}
  </div>
  <p class="dica">${ic('info')}<span>${inline(o.comparativo_dica)}</span></p>
</div></section>

<section class="sec alt"><div class="wrap">
  <div class="head"><span class="eyebrow">${esc(o.valores_chamada)}</span><h2>${titulo(o.valores_titulo)}</h2></div>
  <div class="precos">${tabelaPrecos('vray', o.comparativo_coluna_1)}${tabelaPrecos('ia', o.comparativo_coluna_2)}</div>
  <div class="inclusos"><b>${esc(o.inclusos_titulo)}</b>${lista(o.inclusos).map((i) => `<span>${ic(i.icone)}${esc(i.texto)}</span>`).join('')}</div>
  <div class="mais"><p><b>${esc(o.mais_titulo)}</b>${esc(o.mais_texto)}</p><a class="btn" href="${wa}&text=${encodeURIComponent(o.mais_mensagem || '')}">${ic('msg')}${esc(o.mais_botao)}</a></div>
</div></section>

<section class="sec"><div class="wrap">
  <div class="head"><span class="eyebrow">${esc(o.portfolio_chamada)}</span><h2>${titulo(o.portfolio_titulo)}</h2></div>
  <div class="legenda"><span>${tipo('vray')}${esc(o.legenda_vray)}</span><span>${tipo('ia')}${esc(o.legenda_ia)}</span></div>
  <div class="galeria">${lista(o.portfolio).map((g) => `
    <figure class="card"><div class="moldura"><img src="${img(g.imagem)}"${enq(g.enquadramento)} alt=""></div>
    <figcaption><span>${esc(o.portfolio_rotulo_projeto)}<b>${esc(g.projeto)}</b></span>${tipo(g.tipo)}</figcaption></figure>`).join('')}
  </div>
  <a class="insta-link" href="${insta}">${ic('insta')}${esc(o.portfolio_link_texto)} @${esc(o.instagram_usuario)}${ic('arrow')}</a>
</div></section>

<section class="sec alt"><div class="wrap">
  <div class="head"><span class="eyebrow">${esc(o.etapas_chamada)}</span><h2>${titulo(o.etapas_titulo)}</h2></div>
  <ol class="etapas">${lista(o.etapas).map((e, i) => `<li><span class="ic">${ic(e.icone)}</span><h4><b>${i + 1}</b>${esc(e.titulo)}</h4><p>${esc(e.texto)}</p></li>`).join('')}</ol>
  <div class="saber">
    <div><h4>${esc(o.prazos_titulo)}</h4><ul>${itensIcone(o.prazos)}</ul></div>
    <div><h4>${esc(o.saber_titulo)}</h4><ul>${itensIcone(o.saber)}</ul></div>
  </div>
</div></section>

<section class="final">
  <h2>${esc(o.final_titulo)}</h2>
  <p>${esc(o.final_texto)}</p>
  <a class="btn" href="${wa}&text=${encodeURIComponent(o.final_mensagem || '')}">${ic('msg')}${esc(o.final_botao)}</a>
  <div class="contatos">
    <a href="${wa}">${ic('msg')}${esc(o.whatsapp_exibicao)}</a>
    <a href="mailto:${esc(o.email)}">${ic('mail')}${esc(o.email)}</a>
    <a href="${insta}">${ic('insta')}@${esc(o.instagram_usuario)}</a>
  </div>
</section>
</div>`;
  };

  window.ICONES_ORCAMENTO = ICONES;
})();
