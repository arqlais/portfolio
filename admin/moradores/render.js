/* Proposta para moradores — desenha a folha a partir dos dados de _data/moradores.yml.
 * Usado pelo painel (pré-visualização) e por pdf.html (salvar em PDF). */
(() => {
  'use strict';

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // **negrito** dentro de um texto
  const inline = (v) => esc(v).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const paragrafos = (v) => String(v ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${inline(p).replace(/\n/g, '<br>')}</p>`).join('');
  // títulos: o trecho entre *asteriscos* sai em The Seasons; quebras de linha viram <br>
  const titulo = (v) => esc(v).split('*').map((p, i) => (i % 2 ? `<span class="script">${p}</span>` : p)).join('').replace(/\n/g, '<br>');
  const lista = (v) => (Array.isArray(v) ? v : []);
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const enq = (e) => (e && (e.x != null || e.y != null || e.zoom != null)
    ? ` style="--fx:${num(e.x ?? 50)}%;--fy:${num(e.y ?? 50)}%;--fz:${num(e.zoom ?? 1)}"` : '');
  const cor = (v, padrao) => (/^#[0-9a-f]{3,8}$/i.test(String(v || '').trim()) ? String(v).trim() : padrao);

  const qrSvg = (texto) => {
    if (!window.qrcode) return '';
    try {
      const q = window.qrcode(0, 'M');
      q.addData(texto);
      q.make();
      const n = q.getModuleCount();
      let d = '';
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x},${y}h1v1h-1z`;
      return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" aria-label="QR code do WhatsApp" role="img"><path d="${d}" fill="currentColor"/></svg>`;
    } catch (_) { return ''; }
  };

  /** m = dados da proposta; foto(caminho) = endereço da imagem (fotos novas ainda não salvas). */
  window.renderMoradores = (m, foto = (c) => c) => {
    m = m || {};
    const img = (c) => esc(foto(c || ''));
    const wa = `https://api.whatsapp.com/send?phone=${encodeURIComponent(m.whatsapp_numero || '')}`
      + (m.final_mensagem ? `&text=${encodeURIComponent(m.final_mensagem)}` : '');
    const vars = [
      ['fundo', m.cor_fundo, '#f7f5f1'], ['cartao', m.cor_cartao, '#ffffff'], ['cartao-suave', m.cor_cartao_suave, '#f2ece6'],
      ['linhas', m.cor_linhas, '#e7e2d9'], ['principal', m.cor_principal, '#2a4352'], ['secundaria', m.cor_secundaria, '#4a5d6b'],
      ['destaque', m.cor_destaque, '#af8c86'], ['destaque-suave', m.cor_destaque_suave, '#d0aca3'],
      ['destaque-claro', m.cor_destaque_claro, '#e7d5cf'], ['texto', m.cor_texto, '#584f4a'],
    ].map(([n, v, p]) => `--${n}:${cor(v, p)}`).join(';');

    const motivos = lista(m.motivos).map((x, i) => `
      <div class="mt"><div class="n">${String(i + 1).padStart(2, '0')}</div><div><h3>${esc(x.titulo)}</h3><p>${inline(x.texto)}</p></div></div>`).join('');

    const pacotes = lista(m.pacotes).map((p) => {
      const dest = String(p.destaque || '').trim();
      return `
      <div class="pk${dest ? ' dest' : ''}">
        ${dest ? `<span class="pilula">${esc(dest)}</span>` : ''}
        <span class="lab">${esc(p.rotulo)}</span>
        <h3>${esc(p.nome)}</h3>
        <div class="d">${inline(p.descricao)}</div>
        <ul>${lista(p.itens).map((it) => `<li>${inline(typeof it === 'string' ? it : it.texto)}</li>`).join('')}</ul>
        <div class="v">${esc(p.valor)}</div>${p.parcelas ? `<div class="x">${esc(p.parcelas)}</div>` : ''}
      </div>`;
    }).join('');

    const extras = lista(m.extras);
    const extrasHtml = extras.map((e, i) => {
      const ultimoSozinho = i === extras.length - 1 && extras.length % 2 === 1;
      return `<div class="ei${e.quem === 'engenheiro' ? ' eng' : ''}${ultimoSozinho ? ' largo' : ''}"><b>${esc(e.titulo)}</b><span>${inline(e.texto)}</span></div>`;
    }).join('');

    const etapas = lista(m.etapas);
    const condicoes = lista(m.condicoes).map((c) => `
      <div class="pc"><div class="big">${esc(c.destaque)}</div><h4>${esc(c.titulo)}</h4><p>${inline(c.texto)}</p></div>`).join('');

    return `
<div class="folha" style="${vars}">
  <div class="faixa">
    <div class="k"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color:var(--principal)" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/></svg></div>
    <div class="tx"><small>${esc(m.faixa_rotulo)}</small><span>${inline(m.faixa_texto)}</span></div>
    ${m.faixa_selo ? `<div class="selo">${esc(m.faixa_selo)}</div>` : ''}
  </div>

  <div class="wrap">
    <div class="hero">
      <div>
        <div class="marca"><div class="w">${esc(m.marca || 'laís')}<span>.</span></div><small>${esc(m.marca_sub)}</small></div>
        <h1 class="h1">${titulo(m.titulo)}</h1>
        <div class="txt">${paragrafos(m.texto)}</div>
      </div>
      <div class="destaque-img">
        <div class="img"><img src="${img(m.imagem_destaque)}"${enq(m.imagem_destaque_enquadramento)} alt=""></div>
        ${m.imagem_legenda ? `<div class="cap">${esc(m.imagem_legenda)}</div>` : ''}
        ${m.foto ? `<div class="eu"><img src="${img(m.foto)}"${enq(m.foto_enquadramento)} alt="Laís"></div>` : ''}
      </div>
    </div>

    <div class="nota">
      <div class="carta">
        <div class="aspas">“</div>
        ${paragrafos(m.carta)}
        ${m.carta_assinatura ? `<div class="assina">${esc(m.carta_assinatura)}</div>` : ''}
      </div>
      <div class="transp">
        <div class="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color:var(--principal)" stroke-width="1.8"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M9 12l2 2 4-4"/></svg></div>
        <span class="lab">${esc(m.transparencia_rotulo)}</span>
        ${paragrafos(m.transparencia_texto)}
      </div>
    </div>

    <div class="sec">
      <span class="lab">${esc(m.motivos_chamada)}</span>
      <h2 class="t">${titulo(m.motivos_titulo)}</h2>
      <div class="motivos">${motivos}</div>
    </div>

    <div class="sec">
      <span class="lab">${esc(m.ia_chamada)}</span>
      <h2 class="t">${titulo(m.ia_titulo)}</h2>
      <div class="ia-txt">${paragrafos(m.ia_texto)}</div>
      <div class="ia">
        <div class="col ruim"><h4><i>✕</i>${esc(m.ia_ruim_titulo)}</h4><ul>${lista(m.ia_ruim).map((x) => `<li>${inline(x.texto ?? x)}</li>`).join('')}</ul></div>
        <div class="col bom"><h4><i>✓</i>${esc(m.ia_bom_titulo)}</h4><ul>${lista(m.ia_bom).map((x) => `<li>${inline(x.texto ?? x)}</li>`).join('')}</ul></div>
      </div>
    </div>

    <div class="sec">
      <span class="lab">${esc(m.trabalhos_chamada)}</span>
      <h2 class="t">${titulo(m.trabalhos_titulo)}</h2>
      <div class="galeria">${lista(m.trabalhos).map((t) => `
        <figure><img src="${img(t.imagem)}"${enq(t.enquadramento)} alt="">${t.legenda ? `<figcaption>${esc(t.legenda)}</figcaption>` : ''}</figure>`).join('')}
      </div>
    </div>

    <div class="sec">
      <span class="lab">${esc(m.pacotes_chamada)}</span>
      <h2 class="t">${titulo(m.pacotes_titulo)}</h2>
      <div class="pacotes">${pacotes}</div>
      ${extras.length ? `
      <div class="extras">
        <div class="ch"><span class="lab">${esc(m.extras_rotulo)}</span><h3>${esc(m.extras_titulo)}</h3><p>${inline(m.extras_texto)}</p></div>
        <div class="eg">${extrasHtml}</div>
        <div class="legenda"><i></i>${esc(m.extras_legenda_engenheiro)} <i class="l"></i>${esc(m.extras_legenda_lais)}</div>
      </div>` : ''}
    </div>
  </div>

  <div class="pag">
    <span class="lab">${esc(m.pagamento_chamada)}</span>
    <h2 class="t" style="margin-top:9px">${titulo(m.pagamento_titulo)}</h2>
    <p class="sub">${inline(m.pagamento_texto)}</p>
    <div class="pgrid">
      ${etapas.length ? `<div class="pc etapas"><div class="big">${esc(m.etapas_destaque)}</div><h4>${esc(m.etapas_titulo)}</h4>
        <div class="colunas">${etapas.map((e) => `<div><b>${esc(e.nome)}</b>${String(e.linhas || '').split('\n').filter((l) => l.trim()).map((l) => `<span>${inline(l)}</span>`).join('')}</div>`).join('')}</div></div>` : ''}
      ${condicoes}
    </div>
    ${m.letras_miudas ? `<p class="miudas">${inline(m.letras_miudas)}</p>` : ''}
  </div>

  <div class="final">
    <div class="call"><div class="tt">${titulo(m.final_titulo)}</div><p>${inline(m.final_texto)}</p></div>
    <div class="ct">
      ${m.whatsapp_exibicao ? `<div><span>WhatsApp</span>${esc(m.whatsapp_exibicao)}</div>` : ''}
      ${m.instagram_usuario ? `<div><span>Instagram</span>@${esc(m.instagram_usuario)}</div>` : ''}
      ${m.site ? `<div><span>Site</span>${esc(m.site)}</div>` : ''}
    </div>
    ${m.whatsapp_numero ? `<div class="qr" style="color:var(--principal)">${qrSvg(wa)}</div>` : ''}
  </div>
</div>`;
  };
})();
