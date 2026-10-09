/* Painel do portfólio da Laís.
 * Lê os arquivos de _data/ do repositório no GitHub, mostra formulários simples para editar
 * textos e fotos e, ao salvar, grava tudo num único commit na branch main. O GitHub Pages
 * republica o site sozinho logo depois. */
(() => {
  'use strict';

  const REPO = 'arqlais/portfolio';
  const BRANCH = 'main';
  const API = 'https://api.github.com';
  const CHAVE_TOKEN = 'painel-lais-token';
  const LADO_MAXIMO = 2400; // px — fotos maiores são reduzidas antes de enviar

  /* ---------- Ícones (os mesmos de _includes/icone.html) ---------- */
  const ICONES = {
    formatura: '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/>',
    medalha: '<circle cx="12" cy="8" r="5"/><path d="M8.5 13 7 22l5-3 5 3-1.5-9"/>',
    maleta: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    alvo: '<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/>',
    imagem: '<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M3 15l5-5 4 4 5-6 4 5"/><circle cx="8" cy="8.5" r="1.3"/>',
    cubo: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
    lapis: '<path d="M14 3 21 10 10 21H3v-7L14 3z"/><path d="M13.5 6.5l4 4"/>',
    prancheta: '<path d="M9 2h6l1 3h3v17H5V5h3l1-3z"/><path d="M9 11h6M9 15h6"/>',
    mapa: '<path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z"/><path d="M9 4v13M15 7v13"/>',
    prancha: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  };
  const svgIcone = (nome, mapa = ICONES) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${mapa[nome] || ''}</svg>`;
  // Ícones da página de orçamento (vêm de orcamento/render.js).
  const ICONES_ORCAMENTO = window.ICONES_ORCAMENTO || {};

  /* ---------- O que cada seção do painel mostra ---------- */
  const CURSIVA = 'o trecho entre *asteriscos* aparece em letra cursiva.';
  const texto = (name, label, extra = {}) => ({ type: 'text', name, label, ...extra });
  const textoLongo = (name, label, extra = {}) => ({ type: 'textarea', name, label, ...extra });
  const titulo = (name = 'titulo', label = 'título') => texto(name, label, { hint: CURSIVA });
  const cabecalho = [texto('chamada', 'chamada (texto pequeno acima do título)'), titulo(), textoLongo('texto', 'texto')];
  const selos = {
    type: 'list', name: 'selos', label: 'selos', singular: 'selo', resumo: (s) => s.titulo,
    fields: [{ type: 'icon', name: 'icone', label: 'ícone' }, texto('titulo', 'título'), texto('texto', 'texto')],
    novo: () => ({ icone: 'medalha', titulo: '', texto: '' }),
  };

  // Formatos possíveis para a imagem de um estudo de caso ("inteira" = sem corte).
  const FORMATOS_CASO = [
    ['inteira', 'inteira'], ['1.414/1', 'prancha'], ['4/3', 'paisagem'],
    ['16/9', 'panorâmica'], ['1/1', 'quadrada'], ['4/5', 'retrato'],
  ];

  const SECOES = [
    {
      arquivo: 'inicio', nome: 'início', ancora: '#hero',
      titulo: 'início do <span class="script">site</span>',
      descricao: 'a primeira parte que aparece: sua foto, apresentação, selos e números.',
      grupos: [
        { titulo: 'sua foto', campos: [
          { type: 'image', name: 'foto', label: 'foto de perfil', pasta: 'assets/img', proporcao: '3/4', forma: 'arco', enquadramento: 'foto_enquadramento' },
          texto('foto_alt', 'descrição da foto', { hint: 'usada por leitores de tela (acessibilidade).' }),
        ] },
        { titulo: 'apresentação', campos: [
          texto('saudacao', 'saudação (em letra cursiva)'),
          { type: 'markdown', name: 'apresentacao', label: 'texto de apresentação', hint: 'selecione palavras e clique em B para deixar em negrito. deixe uma linha em branco para começar outro parágrafo.' },
          selos,
          { type: 'duas', campos: [texto('botao_portfolio', 'botão “ver portfólio”'), texto('botao_whatsapp', 'botão do WhatsApp')] },
          { type: 'duas', campos: [texto('chamada_topo', 'frase pequena no topo'), texto('ano', 'ano')] },
        ] },
        { titulo: 'faixa rolante', campos: [
          { type: 'list', name: 'faixa_rolante', label: 'palavras que passam na faixa', singular: 'palavra', layout: 'chips' },
        ] },
        { titulo: 'números', campos: [
          { type: 'list', name: 'numeros', label: 'números em destaque', singular: 'número', resumo: (n) => `${n.numero ?? ''}${n.sufixo ?? ''} ${n.legenda ?? ''}`,
            fields: [{ type: 'duas', campos: [{ type: 'number', name: 'numero', label: 'número' }, texto('sufixo', 'depois do número (ex.: +)')] }, texto('legenda', 'legenda')],
            novo: () => ({ numero: 10, sufixo: '+', legenda: '' }) },
        ] },
        { titulo: 'faixa escura (“você projeta”)', campos: [
          texto('destaque_frase', 'frase em letra cursiva'), texto('destaque_titulo', 'título'), textoLongo('destaque_texto', 'texto'),
        ] },
      ],
    },
    {
      arquivo: 'portfolio', nome: 'portfólio', ancora: '#portfolio',
      titulo: 'portfólio de <span class="script">renders</span>',
      descricao: 'a galeria de imagens. adicione várias fotos de uma vez, mude a ordem e ajuste o enquadramento de cada uma.',
      grupos: [
        { titulo: 'fotos', campos: [
          { type: 'list', name: 'imagens', label: '', singular: 'foto', layout: 'grade', fotoEmMassa: 'imagem',
            fields: [
              { type: 'image', name: 'imagem', label: '', pasta: 'assets/img/gallery', proporcao: '4/5', enquadramento: 'enquadramento', curto: true },
              texto('projeto', 'projeto / cliente'),
              { type: 'opcoes', name: 'tipo', label: '', opcoes: [['vray', 'V-Ray'], ['ia', 'IA']] },
            ],
            novo: () => ({ imagem: '', projeto: '', tipo: 'vray' }) },
        ] },
        { titulo: 'textos da seção', campos: cabecalho },
      ],
    },
    {
      arquivo: 'comparar', nome: 'comparar', ancora: '#compare',
      titulo: 'arraste para <span class="script">comparar</span>',
      descricao: 'as imagens “antes e depois” (print × IA). o enquadramento vale para as duas fotos de cada par.',
      grupos: [
        { titulo: 'comparações', campos: [
          { type: 'list', name: 'comparacoes', label: '', singular: 'comparação', resumo: (c) => c.ambiente,
            fields: [
              { type: 'duas', classe: 'comparacao-par', campos: [
                { type: 'image', name: 'imagem_print', label: 'antes (print)', pasta: 'assets/img/compare', proporcao: '4/5', enquadramento: 'enquadramento', par: 'imagem_ia', curto: true },
                { type: 'image', name: 'imagem_ia', label: 'depois (IA)', pasta: 'assets/img/compare', proporcao: '4/5', enquadramento: 'enquadramento', par: 'imagem_print', curto: true },
              ] },
              { type: 'duas', campos: [texto('ambiente', 'ambiente'), texto('credito', 'crédito')] },
              texto('descricao_alt', 'descrição das imagens', { hint: 'usada por leitores de tela (acessibilidade).' }),
            ],
            novo: () => ({ ambiente: '', descricao_alt: '', credito: '', imagem_print: '', imagem_ia: '' }) },
        ] },
        { titulo: 'textos da seção', campos: [...cabecalho, textoLongo('vray_texto', 'texto sobre V-Ray'), textoLongo('ia_texto', 'texto sobre IA')] },
      ],
    },
    {
      arquivo: 'projetos', nome: 'estudos de caso', ancora: '#projetos',
      titulo: 'estudos de <span class="script">caso</span>',
      descricao: 'as pranchas e projetos com descrição e ficha técnica. escolha se a imagem aparece inteira ou num formato fixo — aí dá para enquadrar.',
      grupos: [
        { titulo: 'projetos', campos: [
          { type: 'list', name: 'projetos', label: '', singular: 'projeto', resumo: (p) => p.categoria,
            fields: [
              { type: 'formato', name: 'formato', label: 'formato da imagem no site', opcoes: FORMATOS_CASO },
              { type: 'image', name: 'imagem', label: 'imagem', pasta: 'assets/img/cases', proporcaoDe: 'formato', enquadramento: 'enquadramento' },
              { type: 'duas', campos: [texto('categoria', 'categoria (texto pequeno)'), titulo()] },
              textoLongo('texto', 'descrição'),
              { type: 'list', name: 'ficha', label: 'ficha técnica', singular: 'linha', layout: 'linhas',
                fields: [texto('rotulo', 'item'), texto('valor', 'valor')], novo: () => ({ rotulo: '', valor: '' }) },
              { type: 'duas', campos: [texto('legenda', 'legenda ao ampliar'), texto('descricao_alt', 'descrição da imagem (acessibilidade)')] },
            ],
            novo: () => ({ imagem: '', descricao_alt: '', legenda: '', categoria: '', titulo: '', texto: '', ficha: [{ rotulo: 'projeto', valor: '' }] }) },
        ] },
        { titulo: 'textos da seção', campos: cabecalho },
      ],
    },
    {
      arquivo: 'servicos', nome: 'serviços', ancora: '#servicos',
      titulo: '<span class="script">serviços</span> e softwares',
      descricao: 'os cartões de serviço, o botão de orçamento e a lista de softwares.',
      grupos: [
        { titulo: 'serviços', campos: [
          { type: 'list', name: 'servicos', label: '', singular: 'serviço', resumo: (s) => s.titulo,
            fields: [{ type: 'icon', name: 'icone', label: 'ícone' }, texto('titulo', 'título'), textoLongo('texto', 'texto')],
            novo: () => ({ icone: 'imagem', titulo: '', texto: '' }) },
        ] },
        { titulo: 'botão de orçamento', campos: [
          texto('botao', 'texto do botão'), texto('mensagem_whatsapp', 'mensagem que já vem escrita no WhatsApp'),
        ] },
        { titulo: 'softwares', campos: [
          { type: 'list', name: 'softwares', label: 'softwares', singular: 'software', layout: 'chips' },
          texto('softwares_chamada', 'chamada'), titulo('softwares_titulo'), textoLongo('softwares_texto', 'texto'),
        ] },
        { titulo: 'textos da seção', campos: cabecalho },
      ],
    },
    {
      arquivo: 'para_quem', nome: 'para quem', ancora: '#sobre',
      titulo: 'para <span class="script">quem</span>',
      descricao: 'as abas “sou arquiteto ou designer” e “sou estudante”.',
      grupos: [
        { titulo: 'abas', campos: [
          { type: 'list', name: 'publicos', label: '', singular: 'aba', resumo: (p) => p.botao,
            fields: [
              { type: 'duas', campos: [texto('botao', 'texto do botão'), texto('etiqueta', 'etiqueta')] },
              texto('titulo', 'título'), textoLongo('texto', 'texto'),
              { type: 'list', name: 'itens', label: 'itens da lista', singular: 'item', layout: 'chips' },
            ],
            novo: () => ({ botao: '', etiqueta: '', titulo: '', texto: '', itens: [] }) },
        ] },
        { titulo: 'título da seção', campos: [texto('chamada', 'chamada'), titulo()] },
      ],
    },
    {
      arquivo: 'como_funciona', nome: 'como funciona', ancora: '#como-funciona',
      titulo: 'como <span class="script">funciona</span>',
      descricao: 'o passo a passo do atendimento. a numeração (01, 02…) é automática.',
      grupos: [
        { titulo: 'etapas', campos: [
          { type: 'list', name: 'etapas', label: '', singular: 'etapa', resumo: (e) => e.titulo,
            fields: [texto('titulo', 'título'), textoLongo('texto', 'texto')], novo: () => ({ titulo: '', texto: '' }) },
        ] },
        { titulo: 'textos da seção', campos: cabecalho },
      ],
    },
    {
      arquivo: 'sobre_mim', nome: 'sobre mim', ancora: '#cursos',
      titulo: 'sobre <span class="script">mim</span>',
      descricao: 'o bloco “método próprio” com seus selos.',
      grupos: [{ titulo: 'textos', campos: [...cabecalho, selos] }],
    },
    {
      arquivo: 'contato', nome: 'chamada final', ancora: '#contato',
      titulo: 'chamada <span class="script">final</span>',
      descricao: 'o bloco escuro no fim da página, com os botões de orçamento e e-mail.',
      grupos: [{ titulo: 'textos', campos: [
        texto('frase', 'frase em letra cursiva'), texto('titulo', 'título'), textoLongo('texto', 'texto'),
        { type: 'duas', campos: [texto('botao_orcamento', 'botão de orçamento'), texto('botao_email', 'botão de e-mail')] },
      ] }],
    },
    {
      arquivo: 'geral', nome: 'contato e dados', ancora: '#contato',
      titulo: 'contato e <span class="script">dados gerais</span>',
      descricao: 'WhatsApp, e-mail e Instagram valem para todos os botões e links do site.',
      grupos: [
        { titulo: 'contato', campos: [
          { type: 'duas', campos: [
            texto('whatsapp_numero', 'WhatsApp (só números)', { hint: 'com 55 e DDD. ex.: 5511969288192' }),
            texto('whatsapp_exibicao', 'WhatsApp (como aparece no rodapé)'),
          ] },
          { type: 'duas', campos: [texto('email', 'e-mail'), texto('instagram_usuario', 'Instagram (sem @)')] },
        ] },
        { titulo: 'rodapé', campos: [textoLongo('rodape_descricao', 'descrição'), texto('rodape_servicos', 'linha final')] },
        { titulo: 'Google e aba do navegador', campos: [
          texto('titulo_pagina', 'título da aba do navegador'),
          textoLongo('descricao_pagina', 'descrição que aparece no Google'),
          { type: 'duas', campos: [texto('marca', 'logo (texto)'), texto('nome', 'nome completo')] },
        ] },
      ],
    },
    {
      id: 'orc-aparencia', aba: 'orcamento', arquivo: 'orcamento', nome: 'letras e topo',
      titulo: 'letras e <span class="script">topo</span>',
      descricao: 'o tamanho das letras de todo o orçamento e a faixa azul do topo. use “pré-visualizar” para ver o resultado.',
      grupos: [
        { titulo: 'tamanho das letras', campos: [
          { type: 'escala', name: 'tamanho_textos', label: 'textos', hint: 'todos os textos do orçamento, mantendo a proporção entre eles.' },
          { type: 'escala', name: 'tamanho_titulos', label: 'títulos em letra cursiva' },
          { type: 'escala', name: 'tamanho_saudacao', label: '“muito prazer!”' },
        ] },
        { titulo: 'faixa do topo e arquivo', campos: [
          { type: 'duas', campos: [texto('topo_esquerda', 'faixa do topo (esquerda)'), texto('topo_direita', 'faixa do topo (direita)')] },
          texto('titulo_aba', 'nome do arquivo PDF', { hint: 'aparece como nome sugerido ao salvar o PDF.' }),
        ] },
      ],
    },
    {
      id: 'orc-apresentacao', aba: 'orcamento', arquivo: 'orcamento', nome: 'apresentação',
      titulo: 'sua <span class="script">apresentação</span>',
      descricao: 'foto, saudação, texto, programas e os selos de formação.',
      grupos: [
        { titulo: 'topo e apresentação', campos: [
          { type: 'image', name: 'foto', label: 'sua foto', pasta: 'assets/img/orcamento', proporcao: '25/31', forma: 'arco', enquadramento: 'foto_enquadramento' },
          texto('foto_alt', 'descrição da foto', { hint: 'usada por leitores de tela (acessibilidade).' }),
          texto('saudacao', 'saudação (em letra cursiva)'),
          { type: 'markdown', name: 'apresentacao', label: 'texto de apresentação', hint: 'selecione palavras e clique em B para deixar em negrito. deixe uma linha em branco para começar outro parágrafo.' },
          { type: 'list', name: 'ferramentas', label: 'programas (pílulas)', singular: 'programa', layout: 'chips' },
          { type: 'list', name: 'credenciais', label: 'selos abaixo da apresentação', singular: 'selo', resumo: (c) => (typeof c === 'string' ? c : c.titulo),
            fields: [{ type: 'icon', name: 'icone', label: 'ícone', icones: ICONES_ORCAMENTO }, { type: 'duas', campos: [texto('titulo', 'título'), texto('texto', 'texto menor')] }],
            novo: () => ({ icone: 'check', titulo: '', texto: '' }) },
        ] },
      ],
    },
    {
      id: 'orc-metodos', aba: 'orcamento', arquivo: 'orcamento', nome: 'os dois métodos',
      titulo: 'os dois <span class="script">métodos</span>',
      descricao: 'os cartões lado a lado de cada método. o trecho entre *asteriscos* nos títulos sai em letra cursiva; **dois asteriscos** deixam em negrito.',
      grupos: [
        { titulo: 'os dois métodos', campos: [
          texto('metodos_chamada', 'chamada (texto pequeno acima do título)'), titulo('metodos_titulo'), textoLongo('metodos_texto', 'texto'),
          texto('ideal_rotulo', 'título da lista (ex.: ideal para)'),
          { type: 'list', name: 'metodos', label: 'cartões', singular: 'método', resumo: (m) => m.nome,
            fields: [
              { type: 'image', name: 'imagem', label: 'imagem de exemplo', pasta: 'assets/img/orcamento', proporcao: '16/10', enquadramento: 'enquadramento' },
              { type: 'duas', campos: [texto('nome', 'nome'), texto('destaque', 'pílula de destaque', { hint: 'ex.: mais escolhido, em alta. deixe vazio para não mostrar.' })] },
              texto('rotulo', 'texto pequeno acima do nome'),
              textoLongo('descricao', 'descrição', { hint: 'use **dois asteriscos** para negrito.' }),
              { type: 'list', name: 'medidores', label: 'barrinhas (nota de 0 a 5)', singular: 'barrinha', resumo: (b) => `${b.nome || ''} ${b.nota ?? ''}/5`,
                fields: [{ type: 'icon', name: 'icone', label: 'ícone', icones: ICONES_ORCAMENTO }, { type: 'duas', campos: [texto('nome', 'nome'), { type: 'number', name: 'nota', label: 'nota (0 a 5)' }] }],
                novo: () => ({ icone: 'target', nome: '', nota: 3 }) },
              { type: 'list', name: 'ideal', label: 'lista “ideal para”', singular: 'item', resumo: (i) => i.texto,
                fields: [{ type: 'icon', name: 'icone', label: 'ícone', icones: ICONES_ORCAMENTO }, texto('texto', 'texto')],
                novo: () => ({ icone: 'check', texto: '' }) },
              { type: 'icon', name: 'ponto_icone', label: 'ícone do ponto forte', icones: ICONES_ORCAMENTO },
              { type: 'duas', campos: [texto('ponto_titulo', 'ponto forte (título)'), texto('ponto_texto', 'ponto forte (texto)')] },
            ],
            novo: () => ({ imagem: '', nome: '', destaque: '', rotulo: '', descricao: '', medidores: [], ideal: [], ponto_icone: 'star', ponto_titulo: '', ponto_texto: '' }) },
        ] },
      ],
    },
    {
      id: 'orc-tabela', aba: 'orcamento', arquivo: 'orcamento', nome: 'tabela comparativa',
      titulo: 'tabela <span class="script">lado a lado</span>',
      descricao: 'as linhas da comparação e a frase abaixo dela.',
      grupos: [
        { titulo: 'tabela lado a lado', campos: [
          { type: 'duas', campos: [texto('comparativo_coluna_1', 'nome da 1ª coluna'), texto('comparativo_coluna_2', 'nome da 2ª coluna')] },
          texto('comparativo_rotulo', 'título da tabela'),
          { type: 'list', name: 'comparativo', label: 'linhas', singular: 'linha', resumo: (c) => c.criterio,
            fields: [
              { type: 'icon', name: 'icone', label: 'ícone', icones: ICONES_ORCAMENTO },
              texto('criterio', 'critério'),
              { type: 'duas', campos: [texto('vray', '1ª coluna'), texto('vray_detalhe', 'detalhe (menor)')] },
              { type: 'opcoes', name: 'vray_vantagem', label: '1ª coluna é vantagem?', opcoes: [['sim', '✓ sim'], ['nao', 'não']] },
              { type: 'duas', campos: [texto('ia', '2ª coluna'), texto('ia_detalhe', 'detalhe (menor)')] },
              { type: 'opcoes', name: 'ia_vantagem', label: '2ª coluna é vantagem?', opcoes: [['sim', '✓ sim'], ['nao', 'não']] },
            ],
            novo: () => ({ icone: 'check', criterio: '', vray: '', vray_detalhe: '', vray_vantagem: 'nao', ia: '', ia_detalhe: '', ia_vantagem: 'nao' }) },
          textoLongo('comparativo_dica', 'frase abaixo da tabela', { hint: 'use **dois asteriscos** para negrito.' }),
        ] },
      ],
    },
    {
      id: 'orc-valores', aba: 'orcamento', arquivo: 'orcamento', nome: 'valores',
      titulo: '<span class="script">valores</span>',
      descricao: 'os pacotes, o que está incluso e a chamada para projeto completo.',
      grupos: [
        { titulo: 'valores', campos: [
          texto('valores_chamada', 'chamada'), titulo('valores_titulo'),
          { type: 'duas', campos: [texto('valores_rotulo_por_imagem', 'texto “valor por imagem”'), texto('selo_mais_pedido', 'selo do mais pedido')] },
          { type: 'list', name: 'pacotes', label: 'pacotes', singular: 'pacote', resumo: (p) => `${p.quantidade} imagem(ns)`,
            hint: 'digite só o total de cada pacote. o valor por imagem e a economia são calculados sozinhos, comparando com o primeiro pacote.',
            fields: [
              { type: 'number', name: 'quantidade', label: 'quantidade de imagens' },
              { type: 'duas', campos: [{ type: 'number', name: 'vray', label: 'total na 1ª coluna (R$)' }, { type: 'number', name: 'ia', label: 'total na 2ª coluna (R$)' }] },
              { type: 'opcoes', name: 'mais_pedido', label: 'mais pedido em', opcoes: [['nenhum', 'nenhum'], ['vray', '1ª coluna'], ['ia', '2ª coluna'], ['ambos', 'os dois']] },
            ],
            novo: () => ({ quantidade: 20, vray: 0, ia: 0, mais_pedido: 'nenhum' }) },
          texto('inclusos_titulo', 'título dos inclusos'),
          { type: 'list', name: 'inclusos', label: 'o que está incluso', singular: 'item', resumo: (i) => i.texto,
            fields: [{ type: 'icon', name: 'icone', label: 'ícone', icones: ICONES_ORCAMENTO }, texto('texto', 'texto')],
            novo: () => ({ icone: 'check', texto: '' }) },
          { type: 'duas', campos: [texto('mais_titulo', 'chamada “projeto completo”'), texto('mais_botao', 'texto do botão')] },
          textoLongo('mais_texto', 'texto'),
          texto('mais_mensagem', 'mensagem que já vem escrita no WhatsApp'),
        ] },
      ],
    },
    {
      id: 'orc-portfolio', aba: 'orcamento', arquivo: 'orcamento', nome: 'portfólio',
      titulo: 'portfólio do <span class="script">orçamento</span>',
      descricao: 'as fotos que aparecem no orçamento (separadas da galeria do site).',
      grupos: [
        { titulo: 'portfólio', campos: [
          texto('portfolio_chamada', 'chamada'), titulo('portfolio_titulo'),
          { type: 'duas', campos: [texto('legenda_vray', 'legenda do selo V-Ray'), texto('legenda_ia', 'legenda do selo IA')] },
          { type: 'duas', campos: [texto('portfolio_rotulo_projeto', 'texto acima do nome (ex.: Projeto)'), texto('portfolio_link_texto', 'link do Instagram')] },
          { type: 'list', name: 'portfolio', label: 'fotos', singular: 'foto', layout: 'grade', fotoEmMassa: 'imagem',
            fields: [
              { type: 'image', name: 'imagem', label: '', pasta: 'assets/img/orcamento', proporcao: '4/5', enquadramento: 'enquadramento', curto: true },
              texto('projeto', 'projeto / cliente'),
              { type: 'opcoes', name: 'tipo', label: '', opcoes: [['vray', 'V-Ray'], ['ia', 'IA']] },
            ],
            novo: () => ({ imagem: '', projeto: '', tipo: 'vray' }) },
        ] },
      ],
    },
    {
      id: 'orc-etapas', aba: 'orcamento', arquivo: 'orcamento', nome: 'etapas e prazos',
      titulo: 'etapas e <span class="script">prazos</span>',
      descricao: 'como funciona, prazos e bom saber.',
      grupos: [
        { titulo: 'como funciona, prazos e bom saber', campos: [
          texto('etapas_chamada', 'chamada'), titulo('etapas_titulo'),
          { type: 'list', name: 'etapas', label: 'etapas (a numeração é automática)', singular: 'etapa', resumo: (e) => e.titulo,
            fields: [{ type: 'icon', name: 'icone', label: 'ícone', icones: ICONES_ORCAMENTO }, texto('titulo', 'título'), textoLongo('texto', 'texto')],
            novo: () => ({ icone: 'check', titulo: '', texto: '' }) },
          texto('prazos_titulo', 'título da coluna de prazos'),
          { type: 'list', name: 'prazos', label: 'prazos', singular: 'item', resumo: (i) => i.texto,
            fields: [{ type: 'icon', name: 'icone', label: 'ícone', icones: ICONES_ORCAMENTO }, texto('texto', 'texto', { hint: 'use **dois asteriscos** para negrito.' })],
            novo: () => ({ icone: 'check', texto: '' }) },
          texto('saber_titulo', 'título da coluna “bom saber”'),
          { type: 'list', name: 'saber', label: 'bom saber', singular: 'item', resumo: (i) => i.texto,
            fields: [{ type: 'icon', name: 'icone', label: 'ícone', icones: ICONES_ORCAMENTO }, texto('texto', 'texto', { hint: 'use **dois asteriscos** para negrito.' })],
            novo: () => ({ icone: 'check', texto: '' }) },
        ] },
      ],
    },
    {
      id: 'orc-contato', aba: 'orcamento', arquivo: 'orcamento', nome: 'contato',
      titulo: 'chamada <span class="script">final</span>',
      descricao: 'o bloco azul do fim, com WhatsApp, e-mail e Instagram.',
      grupos: [
        { titulo: 'chamada final e contatos', campos: [
          texto('final_titulo', 'título (em letra cursiva)'), textoLongo('final_texto', 'texto'),
          { type: 'duas', campos: [texto('final_botao', 'texto do botão'), texto('final_mensagem', 'mensagem que já vem escrita no WhatsApp')] },
          { type: 'duas', campos: [
            texto('whatsapp_numero', 'WhatsApp (só números)', { hint: 'com 55 e DDD. ex.: 5511969288192' }),
            texto('whatsapp_exibicao', 'WhatsApp (como aparece)'),
          ] },
          { type: 'duas', campos: [texto('email', 'e-mail'), texto('instagram_usuario', 'Instagram (sem @)')] },
        ] },
      ],
    },
  ];
  SECOES.forEach((sc) => { sc.id = sc.id || sc.arquivo; sc.aba = sc.aba || 'site'; });
  const ABAS = [['site', 'site'], ['orcamento', 'orçamento (PDF)']];
  const secaoPorId = (id) => SECOES.find((sc) => sc.id === id);
  const ARQUIVOS = [...new Set(SECOES.map((sc) => sc.arquivo))];

  /* ---------- Estado ---------- */
  let token = '';
  const dados = {};            // arquivo -> objeto
  const alterados = new Set(); // arquivos com mudanças não salvas
  const fotosNovas = new Map(); // caminho público -> { blob, url, enviada }
  let secaoAtual = SECOES[0].id;

  /* ---------- Utilidades ---------- */
  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, conteudo) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (conteudo != null) e.textContent = conteudo;
    return e;
  };
  // "manter conectada": o token fica no aparelho (localStorage); sem isso, só até fechar o
  // navegador (sessionStorage).
  const guardarToken = (valor, lembrar) => {
    try {
      localStorage.removeItem(CHAVE_TOKEN);
      sessionStorage.removeItem(CHAVE_TOKEN);
      if (valor) (lembrar ? localStorage : sessionStorage).setItem(CHAVE_TOKEN, valor);
    } catch (_) {}
  };
  const lerToken = () => {
    try { return localStorage.getItem(CHAVE_TOKEN) || sessionStorage.getItem(CHAVE_TOKEN) || ''; } catch (_) { return ''; }
  };
  const limitar = (v, min, max) => Math.min(max, Math.max(min, v));

  let timerAviso;
  const avisar = (msg, erro = false) => {
    const a = $('#aviso');
    a.textContent = msg;
    a.classList.toggle('erro-aviso', erro);
    a.hidden = false;
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => { a.hidden = true; }, erro ? 9000 : 5000);
  };

  const urlFoto = (caminho) => {
    if (!caminho) return '';
    const nova = fotosNovas.get(caminho);
    if (nova) return nova.url;
    return caminho.startsWith('/') || /^https?:/.test(caminho) ? caminho : '/' + caminho;
  };

  /* ---------- GitHub ---------- */
  const gh = async (caminho, { method = 'GET', body, cru = false } = {}) => {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: cru ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
    };
    if (body) headers['Content-Type'] = 'application/json';
    const res = await fetch(API + caminho, { method, headers, body: body && JSON.stringify(body), cache: 'no-store' });
    if (!res.ok) {
      const erro = new Error(`GitHub respondeu ${res.status}`);
      erro.status = res.status;
      throw erro;
    }
    if (cru) return res.text();
    return res.status === 204 ? null : res.json();
  };

  const verificarToken = async () => {
    const repo = await gh(`/repos/${REPO}`);
    if (!repo.permissions || !repo.permissions.push) {
      const e = new Error('sem permissão'); e.status = 403; throw e;
    }
  };

  const carregarDados = async () => {
    const ref = await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`);
    const sha = ref.object.sha;
    await Promise.all(ARQUIVOS.map(async (arquivo) => {
      const txt = await gh(`/repos/${REPO}/contents/_data/${arquivo}.yml?ref=${sha}`, { cru: true });
      dados[arquivo] = jsyaml.load(txt) || {};
    }));
    alterados.clear();
  };

  const blobParaBase64 = (blob) => new Promise((ok, falha) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1]);
    r.onerror = falha;
    r.readAsDataURL(blob);
  });

  const paraYaml = (obj) => jsyaml.dump(obj, { lineWidth: -1, noRefs: true, forceQuotes: true, quotingType: '"' });

  const salvar = async () => {
    const arquivos = [...alterados];
    if (!arquivos.length) return;
    const botao = $('#botao-salvar');
    botao.disabled = true;
    botao.textContent = 'salvando…';
    try {
      const ref = await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`);
      const pai = ref.object.sha;
      const commitPai = await gh(`/repos/${REPO}/git/commits/${pai}`);
      const arvore = [];

      // Fotos novas que estão em uso em algum texto alterado
      const usado = arquivos.map((a) => JSON.stringify(dados[a])).join('\n');
      for (const [caminho, foto] of fotosNovas) {
        if (foto.enviada || !usado.includes(`"${caminho}"`)) continue;
        const blob = await gh(`/repos/${REPO}/git/blobs`, {
          method: 'POST', body: { content: await blobParaBase64(foto.blob), encoding: 'base64' },
        });
        arvore.push({ path: caminho.replace(/^\//, ''), mode: '100644', type: 'blob', sha: blob.sha, _foto: foto });
      }
      for (const a of arquivos) {
        arvore.push({ path: `_data/${a}.yml`, mode: '100644', type: 'blob', content: paraYaml(dados[a]) });
      }

      const novaArvore = await gh(`/repos/${REPO}/git/trees`, {
        method: 'POST',
        body: { base_tree: commitPai.tree.sha, tree: arvore.map(({ _foto, ...item }) => item) },
      });
      const nomes = arquivos.map((a) => (a === 'orcamento' ? 'orçamento' : SECOES.find((s) => s.arquivo === a).nome)).join(', ');
      const commit = await gh(`/repos/${REPO}/git/commits`, {
        method: 'POST',
        body: { message: `Atualiza o site pelo painel (${nomes})`, tree: novaArvore.sha, parents: [pai] },
      });
      await gh(`/repos/${REPO}/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: { sha: commit.sha } });

      arvore.forEach((item) => { if (item._foto) item._foto.enviada = true; });
      alterados.clear();
      atualizarBarra();
      montarMenu();
      avisar(arquivos.every((a) => a === 'orcamento') ? 'orçamento salvo!' : 'salvo! o site atualiza em cerca de 1 minuto.');
    } catch (e) {
      console.error(e);
      avisar(e.status === 401
        ? 'seu token expirou ou foi apagado. saia e entre de novo com um token novo.'
        : 'não foi possível salvar. confira sua internet e tente de novo — nada foi perdido.', true);
    } finally {
      botao.disabled = false;
      botao.textContent = 'salvar e publicar';
    }
  };

  /* ---------- Fotos ---------- */
  const nomeArquivo = (nome) => {
    const base = nome.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'foto';
    return `${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}.jpg`;
  };

  const carregarImagem = (url) => new Promise((ok, falha) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = falha;
    img.src = url;
  });

  /** Reduz a foto (se for muito grande), converte para JPG e guarda até a hora de salvar. */
  const prepararFoto = async (arquivo, pasta) => {
    const urlOriginal = URL.createObjectURL(arquivo);
    try {
      const img = await carregarImagem(urlOriginal);
      const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * escala);
      canvas.height = Math.round(img.naturalHeight * escala);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.86));
      const caminho = `/${pasta}/${nomeArquivo(arquivo.name)}`;
      fotosNovas.set(caminho, { blob, url: URL.createObjectURL(blob), enviada: false });
      return caminho;
    } finally {
      URL.revokeObjectURL(urlOriginal);
    }
  };

  const escolherArquivos = (multiplos) => new Promise((ok) => {
    const input = el('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = multiplos;
    input.onchange = () => ok([...input.files]);
    input.click();
  });

  const aplicarEnquadramento = (img, e) => {
    img.style.setProperty('--fx', `${e && e.x != null ? e.x : 50}%`);
    img.style.setProperty('--fy', `${e && e.y != null ? e.y : 50}%`);
    img.style.setProperty('--fz', `${e && e.zoom != null ? e.zoom : 1}`);
  };

  const criarMoldura = (caminho, campo, enq, largura) => {
    const m = el('div', 'moldura' + (campo.forma === 'arco' ? ' arco' : '') + (campo.proporcao ? '' : ' livre'));
    if (campo.proporcao) m.style.aspectRatio = campo.proporcao;
    if (largura) m.style.width = largura;
    if (caminho) {
      const img = el('img');
      img.alt = '';
      img.src = urlFoto(caminho);
      img.draggable = false;
      if (campo.enquadramento) aplicarEnquadramento(img, enq);
      m.append(img);
    } else {
      if (!campo.proporcao) m.style.aspectRatio = '4/3';
      m.append(el('div', 'vazia', 'sem foto'));
    }
    return m;
  };

  /* ---------- Modal de enquadramento ---------- */
  const abrirEnquadramento = ({ fotos, campo, valor, aoAplicar }) => {
    const modal = $('#modal-enquadrar');
    const caixa = $('#enq-molduras');
    const zoom = $('#enq-zoom');
    const est = { x: valor?.x ?? 50, y: valor?.y ?? 50, zoom: valor?.zoom ?? 1 };
    caixa.innerHTML = '';

    const [pw, ph] = String(campo.proporcao || '1/1').split('/').map(Number);
    const deitada = pw / (ph || 1) > 1.05;
    const largura = fotos.length > 1 ? 'min(300px, 42vw)'
      : campo.forma === 'arco' ? 'min(320px, 70vw)'
      : deitada ? 'min(620px, 86vw)' : 'min(380px, 80vw)';
    const molduras = fotos.map((f) => {
      const fig = el('figure');
      const m = criarMoldura(f.caminho, campo, est, largura);
      fig.append(m);
      if (f.rotulo) fig.append(el('figcaption', null, f.rotulo));
      caixa.append(fig);
      return m;
    });
    const imgs = molduras.map((m) => m.querySelector('img')).filter(Boolean);
    const atualizar = () => { imgs.forEach((i) => aplicarEnquadramento(i, est)); zoom.value = est.zoom; };
    atualizar();

    // Arrastar: converte o deslocamento em pixels para a nova posição (em %), de forma que a
    // foto acompanhe o dedo/mouse exatamente.
    // No celular, dois dedos (pinça) controlam o zoom.
    molduras.forEach((m) => {
      let inicio = null;
      let pinca = null;
      const toques = new Map();
      const distancia = () => {
        const [a, b] = [...toques.values()];
        return Math.hypot(a.x - b.x, a.y - b.y);
      };
      m.onpointerdown = (ev) => {
        const img = m.querySelector('img');
        if (!img || !img.naturalWidth) return;
        m.setPointerCapture(ev.pointerId);
        toques.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        if (toques.size === 2) {
          inicio = null;
          pinca = { d: distancia(), zoom: est.zoom };
        } else if (toques.size === 1) {
          inicio = { px: ev.clientX, py: ev.clientY, x: est.x, y: est.y, img };
        }
      };
      m.onpointermove = (ev) => {
        if (toques.has(ev.pointerId)) toques.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        if (pinca && toques.size === 2) {
          est.zoom = limitar(pinca.zoom * (distancia() / pinca.d), 1, 3);
          atualizar();
          return;
        }
        if (!inicio) return;
        const r = m.getBoundingClientRect();
        const { naturalWidth: nw, naturalHeight: nh } = inicio.img;
        const s = Math.max(r.width / nw, r.height / nh);
        const sobraX = est.zoom * nw * s - r.width;
        const sobraY = est.zoom * nh * s - r.height;
        if (sobraX > 0.5) est.x = limitar(inicio.x - ((ev.clientX - inicio.px) / sobraX) * 100, 0, 100);
        if (sobraY > 0.5) est.y = limitar(inicio.y - ((ev.clientY - inicio.py) / sobraY) * 100, 0, 100);
        atualizar();
      };
      m.onpointerup = m.onpointercancel = (ev) => {
        toques.delete(ev.pointerId);
        pinca = null;
        inicio = null;
      };
      m.onwheel = (ev) => {
        ev.preventDefault();
        est.zoom = limitar(est.zoom - ev.deltaY * 0.002, 1, 3);
        atualizar();
      };
    });
    zoom.oninput = () => { est.zoom = Number(zoom.value); atualizar(); };
    $('#enq-centralizar').onclick = () => { est.x = 50; est.y = 50; est.zoom = 1; atualizar(); };

    const fechar = () => { modal.hidden = true; document.body.style.overflow = ''; document.onkeydown = null; };
    $('#enq-cancelar').onclick = fechar;
    modal.onclick = (ev) => { if (ev.target === modal) fechar(); };
    document.onkeydown = (ev) => { if (ev.key === 'Escape') fechar(); };
    $('#enq-aplicar').onclick = () => {
      aoAplicar({ x: Math.round(est.x * 10) / 10, y: Math.round(est.y * 10) / 10, zoom: Math.round(est.zoom * 100) / 100 });
      fechar();
    };
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  /* ---------- Formulários ---------- */
  const marcar = () => { alterados.add(secaoPorId(secaoAtual).arquivo); atualizarBarra(); montarMenu(); };
  const redesenhar = () => {
    const y = window.scrollY;
    mostrarSecao(secaoAtual, false);
    window.scrollTo(0, y);
  };

  const rotular = (wrap, campo, id) => {
    if (campo.label) {
      const l = el('label', null, campo.label);
      if (id) l.htmlFor = id;
      wrap.append(l);
    }
    if (campo.hint) wrap.append(el('p', 'dica', campo.hint));
  };

  let contadorId = 0;
  const campoTexto = (campo, obj) => {
    const wrap = el('div', 'campo');
    const id = `c${++contadorId}`;
    rotular(wrap, campo, id);
    const longo = campo.type === 'textarea' || campo.type === 'markdown';
    const input = el(longo ? 'textarea' : 'input');
    input.id = id;
    if (!longo) input.type = campo.type === 'number' ? 'number' : 'text';
    input.value = obj[campo.name] ?? '';
    input.oninput = () => {
      obj[campo.name] = campo.type === 'number' ? (input.value === '' ? 0 : Number(input.value)) : input.value;
      marcar();
    };
    if (campo.type === 'markdown') {
      input.style.minHeight = '180px';
      const barra = el('div', 'barra-texto');
      const b = el('button', null, 'B');
      b.type = 'button';
      b.title = 'negrito';
      b.onclick = () => {
        const { selectionStart: i, selectionEnd: f, value: v } = input;
        if (i === f) return;
        input.value = `${v.slice(0, i)}**${v.slice(i, f)}**${v.slice(f)}`;
        input.oninput();
        input.focus();
      };
      barra.append(b);
      wrap.append(barra);
    }
    wrap.append(input);
    return wrap;
  };

  const campoIcone = (campo, obj) => {
    const wrap = el('div', 'campo');
    wrap.append(el('span', 'rotulo', campo.label));
    const grade = el('div', 'icones');
    const mapa = campo.icones || ICONES;
    Object.keys(mapa).forEach((nome) => {
      const b = el('button', obj[campo.name] === nome ? 'ativo' : '');
      b.type = 'button';
      b.title = nome;
      b.innerHTML = svgIcone(nome, mapa);
      b.onclick = () => {
        obj[campo.name] = nome;
        grade.querySelectorAll('button').forEach((x) => x.classList.toggle('ativo', x === b));
        marcar();
      };
      grade.append(b);
    });
    wrap.append(grade);
    return wrap;
  };

  const campoOpcoes = (campo, obj) => {
    const wrap = el('div', 'campo');
    if (campo.label) wrap.append(el('span', 'rotulo', campo.label));
    const grupo = el('div', 'opcoes');
    campo.opcoes.forEach(([valor, nome]) => {
      const b = el('button', (obj[campo.name] || campo.opcoes[0][0]) === valor ? 'ativo' : '', nome);
      b.type = 'button';
      b.onclick = () => {
        obj[campo.name] = valor;
        grupo.querySelectorAll('button').forEach((x) => x.classList.toggle('ativo', x === b));
        marcar();
        if (campo.redesenhar) redesenhar();
      };
      grupo.append(b);
    });
    wrap.append(grupo);
    return wrap;
  };

  // Escolha do formato: grade com um desenho da proporção em cada opção.
  const campoFormato = (campo, obj) => {
    const wrap = el('div', 'campo');
    wrap.append(el('span', 'rotulo', campo.label));
    const grade = el('div', 'formatos');
    const atual = obj[campo.name] || campo.opcoes[0][0];
    campo.opcoes.forEach(([valor, nome]) => {
      const b = el('button', valor === atual ? 'ativo' : '');
      b.type = 'button';
      const forma = el('span', 'forma' + (valor === 'inteira' ? ' livre' : ''));
      if (valor !== 'inteira') forma.style.aspectRatio = valor;
      b.append(forma, el('span', null, nome));
      b.onclick = () => { obj[campo.name] = valor; marcar(); redesenhar(); };
      grade.append(b);
    });
    wrap.append(grade);
    return wrap;
  };

  const campoFoto = (campoBase, obj) => {
    let campo = campoBase;
    if (campoBase.proporcaoDe) {
      const formato = obj[campoBase.proporcaoDe];
      const fixo = formato && formato !== 'inteira';
      campo = { ...campoBase, proporcao: fixo ? formato : null, enquadramento: fixo ? campoBase.enquadramento : null };
    }
    const wrap = el('div', 'campo');
    if (campo.label) wrap.append(el('span', 'rotulo', campo.label));
    const linha = el('div', 'foto-campo');
    const enq = campo.enquadramento ? obj[campo.enquadramento] : null;
    const miniatura = criarMoldura(obj[campo.name], campo, enq);
    miniatura.classList.add('tocavel');
    linha.append(miniatura);
    const botoes = el('div', 'foto-botoes');

    const trocar = el('button', 'btn btn-ghost btn-sm', obj[campo.name] ? (campo.curto ? 'trocar' : 'trocar foto') : 'escolher foto');
    trocar.type = 'button';
    trocar.onclick = async () => {
      const [arquivo] = await escolherArquivos(false);
      if (!arquivo) return;
      trocar.disabled = true;
      trocar.textContent = 'preparando…';
      try {
        obj[campo.name] = await prepararFoto(arquivo, campo.pasta);
        if (campoBase.enquadramento && !campo.par) delete obj[campoBase.enquadramento];
        marcar();
      } catch (_) {
        avisar('não consegui abrir essa imagem. tente uma foto em JPG ou PNG.', true);
      }
      redesenhar();
    };
    botoes.append(trocar);

    if (campo.enquadramento && obj[campo.name]) {
      const ajustar = el('button', 'btn btn-terra btn-sm', campo.curto ? 'enquadrar' : 'ajustar enquadramento');
      ajustar.type = 'button';
      ajustar.onclick = () => {
        const fotos = [{ caminho: obj[campo.name], rotulo: campo.par ? campo.label : '' }];
        if (campo.par && obj[campo.par]) {
          const par = { caminho: obj[campo.par], rotulo: 'a outra foto do par' };
          if (campo.name === 'imagem_ia') fotos.unshift(par); else fotos.push(par);
        }
        abrirEnquadramento({
          fotos, campo, valor: obj[campo.enquadramento],
          aoAplicar: (v) => { obj[campo.enquadramento] = v; marcar(); redesenhar(); },
        });
      };
      botoes.append(ajustar);
    }
    if (campoBase.proporcaoDe && !campo.proporcao && obj[campo.name]) {
      botoes.append(el('p', 'dica', 'a imagem aparece inteira. para enquadrar, escolha um formato acima.'));
    }
    // Tocar/clicar na própria foto: enquadra (se der) ou escolhe outra foto.
    const acaoFoto = botoes.querySelector('.btn-terra') || trocar;
    miniatura.title = acaoFoto === trocar ? 'escolher foto' : 'ajustar enquadramento';
    miniatura.onclick = () => acaoFoto.click();
    linha.append(botoes);
    wrap.append(linha);
    return wrap;
  };

  // Tamanho em %: controle deslizante com o valor ao lado (100% = tamanho original).
  const campoEscala = (campo, obj) => {
    const wrap = el('div', 'campo');
    const id = `c${++contadorId}`;
    rotular(wrap, campo, id);
    const linha = el('div', 'escala');
    const input = el('input');
    input.type = 'range'; input.id = id; input.min = 70; input.max = 140; input.step = 5;
    input.value = obj[campo.name] || 100;
    const valor = el('output', null, `${input.value}%`);
    const voltar = el('button', 'btn btn-ghost btn-sm', 'original');
    voltar.type = 'button';
    input.oninput = () => { obj[campo.name] = Number(input.value); valor.textContent = `${input.value}%`; marcar(); };
    voltar.onclick = () => { input.value = 100; input.oninput(); };
    linha.append(input, valor, voltar);
    wrap.append(linha);
    return wrap;
  };

  const botaoIcone = (simbolo, titulo, acao, desativado = false, perigo = false) => {
    const b = el('button', 'icone-btn' + (perigo ? ' perigo' : ''), simbolo);
    b.type = 'button';
    b.title = titulo;
    b.setAttribute('aria-label', titulo);
    b.disabled = desativado;
    b.onclick = acao;
    return b;
  };

  const campoLista = (campo, obj) => {
    if (!Array.isArray(obj[campo.name])) obj[campo.name] = [];
    const lista = obj[campo.name];
    const wrap = el('div', 'campo');
    if (campo.label) wrap.append(el('span', 'rotulo', campo.label));
    if (campo.hint) wrap.append(el('p', 'dica', campo.hint));

    const mover = (i, d) => { const [x] = lista.splice(i, 1); lista.splice(i + d, 0, x); marcar(); redesenhar(); };
    const remover = (i) => {
      if (!confirm(`remover ${campo.singular === 'foto' ? 'esta foto' : `este(a) ${campo.singular}`}?`)) return;
      lista.splice(i, 1); marcar(); redesenhar();
    };

    if (campo.layout === 'chips') {
      const chips = el('div', 'chips');
      lista.forEach((valor, i) => {
        const chip = el('span', 'chip');
        const input = el('input');
        input.value = valor;
        input.size = Math.max(4, String(valor).length);
        input.oninput = () => { lista[i] = input.value; input.size = Math.max(4, input.value.length); marcar(); };
        chip.append(input, botaoIcone('×', 'remover', () => { lista.splice(i, 1); marcar(); redesenhar(); }));
        chips.append(chip);
      });
      const add = el('button', 'btn btn-ghost btn-sm', `+ ${campo.singular}`);
      add.type = 'button';
      add.onclick = () => {
        lista.push(''); marcar(); redesenhar();
        const inputs = document.querySelectorAll('.chip input');
        inputs[inputs.length - 1]?.focus();
      };
      chips.append(add);
      wrap.append(chips);
      return wrap;
    }

    const grade = campo.layout === 'grade';
    const linhas = campo.layout === 'linhas';
    const container = el('div', grade ? 'grade' : 'lista');
    lista.forEach((item, i) => {
      const card = el('div', 'item');
      const acoes = el('div', 'item-acoes');
      acoes.append(
        botaoIcone(grade ? '←' : '↑', 'mover para antes', () => mover(i, -1), i === 0),
        botaoIcone(grade ? '→' : '↓', 'mover para depois', () => mover(i, 1), i === lista.length - 1),
        botaoIcone('🗑', 'remover', () => remover(i), false, true),
      );
      if (grade) {
        campo.fields.forEach((f) => card.append(renderizarCampo(f, item)));
        const rodape = el('div', 'item-rodape');
        rodape.append(acoes);
        card.append(rodape);
      } else if (linhas) {
        const linha = el('div', 'duas-colunas');
        campo.fields.forEach((f) => linha.append(renderizarCampo(f, item)));
        card.style.padding = '12px';
        card.append(linha);
        const rodape = el('div', 'item-acoes');
        rodape.style.justifyContent = 'flex-end';
        rodape.append(...acoes.childNodes);
        card.append(rodape);
      } else {
        const topo = el('div', 'item-topo');
        const resumo = campo.resumo && campo.resumo(item);
        topo.append(el('strong', null, resumo && String(resumo).trim() ? resumo : `${campo.singular} ${i + 1}`), acoes);
        card.append(topo);
        campo.fields.forEach((f) => card.append(renderizarCampo(f, item)));
      }
      container.append(card);
    });
    wrap.append(container);

    const adicionar = el('div', 'adicionar');
    if (campo.fotoEmMassa) {
      const fotoCampo = campo.fields.find((f) => f.name === campo.fotoEmMassa);
      const b = el('button', 'btn btn-primary btn-sm', '+ adicionar fotos');
      b.type = 'button';
      b.onclick = async () => {
        const arquivos = await escolherArquivos(true);
        if (!arquivos.length) return;
        b.disabled = true;
        b.textContent = `preparando ${arquivos.length} foto(s)…`;
        for (const arq of arquivos) {
          try {
            const caminho = await prepararFoto(arq, fotoCampo.pasta);
            lista.unshift({ ...campo.novo(), [campo.fotoEmMassa]: caminho });
          } catch (_) {
            avisar(`não consegui abrir “${arq.name}”.`, true);
          }
        }
        marcar();
        redesenhar();
        avisar('fotos adicionadas no começo da galeria. ajuste o projeto e o tipo de cada uma e depois salve.');
      };
      adicionar.append(b);
    } else {
      const b = el('button', 'btn btn-ghost btn-sm', `+ adicionar ${campo.singular}`);
      b.type = 'button';
      b.onclick = () => { lista.push(campo.novo()); marcar(); redesenhar(); };
      adicionar.append(b);
    }
    wrap.append(adicionar);
    return wrap;
  };

  const renderizarCampo = (campo, obj) => {
    switch (campo.type) {
      case 'duas': {
        const d = el('div', 'duas-colunas' + (campo.classe ? ` ${campo.classe}` : ''));
        campo.campos.forEach((c) => d.append(renderizarCampo(c, obj)));
        return d;
      }
      case 'image': return campoFoto(campo, obj);
      case 'icon': return campoIcone(campo, obj);
      case 'opcoes': return campoOpcoes(campo, obj);
      case 'formato': return campoFormato(campo, obj);
      case 'list': return campoLista(campo, obj);
      case 'escala': return campoEscala(campo, obj);
      default: return campoTexto(campo, obj);
    }
  };

  /* ---------- Orçamento: pré-visualizar e salvar em PDF ---------- */
  const PAGINA_PDF = '/admin/orcamento/pdf.html';
  // Dados enviados para a página do orçamento (inclui fotos novas ainda não salvas).
  const pacoteOrcamento = () => {
    const fotos = {};
    fotosNovas.forEach((f, caminho) => { fotos[caminho] = f.url; });
    return { tipo: 'orcamento-dados', dados: JSON.parse(JSON.stringify(dados.orcamento || {})), fotos };
  };
  // A página do orçamento avisa quando está pronta; respondemos com os dados.
  window.addEventListener('message', (ev) => {
    if (ev.origin !== location.origin || !ev.data) return;
    if (ev.data.tipo === 'orcamento-pronto') ev.source.postMessage(pacoteOrcamento(), location.origin);
    if (ev.data.tipo === 'orcamento-altura') ajustarPrevia(ev.data.altura);
  });

  const LARGURA_PDF = 1024;
  let alturaPrevia = 0;
  const ajustarPrevia = (altura) => {
    if (altura) alturaPrevia = altura;
    const palco = $('#previa-palco');
    const quadro = $('#previa-quadro');
    if (!palco || !quadro) return;
    const escala = Math.min(1, (palco.clientWidth - 2) / LARGURA_PDF);
    quadro.style.transform = `scale(${escala})`;
    quadro.style.height = `${alturaPrevia || 2000}px`;
    $('#previa-folha').style.width = `${LARGURA_PDF * escala}px`;
    $('#previa-folha').style.height = `${(alturaPrevia || 2000) * escala}px`;
  };
  window.addEventListener('resize', () => ajustarPrevia());

  const abrirPrevia = () => {
    const modal = $('#modal-previa');
    alturaPrevia = 0;
    $('#previa-palco').innerHTML = '<div class="previa-folha" id="previa-folha"><iframe id="previa-quadro" title="pré-visualização do orçamento"></iframe></div>';
    $('#previa-quadro').src = PAGINA_PDF;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    ajustarPrevia();
  };
  const fecharPrevia = () => {
    $('#modal-previa').hidden = true;
    $('#previa-palco').innerHTML = '';
    document.body.style.overflow = '';
  };
  const salvarPdf = () => {
    const janela = window.open(`${PAGINA_PDF}?imprimir`, '_blank');
    if (!janela) avisar('o navegador bloqueou a nova aba. permita pop-ups para lais3d.com.br e tente de novo.', true);
  };

  const barraOrcamento = () => {
    const barra = el('div', 'acoes-orcamento');
    const ver = el('button', 'btn btn-ghost btn-sm', 'pré-visualizar');
    ver.type = 'button';
    ver.onclick = abrirPrevia;
    const pdf = el('button', 'btn btn-primary btn-sm', 'salvar em PDF');
    pdf.type = 'button';
    pdf.onclick = salvarPdf;
    barra.append(ver, pdf);
    if (alterados.has('orcamento')) {
      barra.append(el('span', 'dica', 'a pré-visualização e o PDF já mostram as alterações, mesmo antes de salvar.'));
    }
    return barra;
  };

  /* ---------- Navegação ---------- */
  const montarMenu = () => {
    const atual = secaoPorId(secaoAtual);
    const abas = $('#abas');
    abas.innerHTML = '';
    ABAS.forEach(([aba, nome]) => {
      const b = el('button', aba === atual.aba ? 'ativo' : '', nome);
      b.type = 'button';
      if (SECOES.some((sc) => sc.aba === aba && alterados.has(sc.arquivo))) {
        const p = el('span', 'ponto');
        p.title = 'alterações não salvas';
        b.append(p);
      }
      b.onclick = () => { if (aba !== atual.aba) location.hash = SECOES.find((sc) => sc.aba === aba).id; };
      abas.append(b);
    });
    const menu = $('#menu');
    menu.innerHTML = '';
    SECOES.filter((sc) => sc.aba === atual.aba).forEach((sc) => {
      const a = el('a', sc.id === secaoAtual ? 'ativo' : '', sc.nome);
      a.href = `#${sc.id}`;
      if (sc.aba === 'site' && alterados.has(sc.arquivo)) {
        const p = el('span', 'ponto');
        p.title = 'alterações não salvas';
        a.append(p);
      }
      menu.append(a);
    });
    // No celular o menu rola para o lado: mantém a seção aberta à vista.
    const ativo = menu.querySelector('.ativo');
    if (ativo && menu.scrollWidth > menu.clientWidth) {
      menu.scrollLeft = ativo.offsetLeft - (menu.clientWidth - ativo.offsetWidth) / 2;
    }
  };

  const mostrarSecao = (id, rolarParaTopo = true) => {
    const secao = secaoPorId(id) || SECOES[0];
    secaoAtual = secao.id;
    const conteudo = $('#conteudo');
    conteudo.innerHTML = '';

    const topo = el('div', 'secao-topo');
    const h1 = el('h1');
    h1.innerHTML = secao.titulo;
    const p = el('p', null, secao.descricao + ' ');
    if (secao.aba === 'orcamento') {
      topo.append(h1, p, barraOrcamento());
    } else {
      const link = el('a', null, 'ver no site ↗');
      link.href = `/${secao.ancora}`;
      link.target = '_blank';
      link.rel = 'noopener';
      p.append(link);
      topo.append(h1, p);
    }
    conteudo.append(topo);

    const obj = dados[secao.arquivo];
    secao.grupos.forEach((g) => {
      const cartao = el('section', 'cartao');
      cartao.append(el('h2', null, g.titulo));
      g.campos.forEach((c) => cartao.append(renderizarCampo(c, obj)));
      conteudo.append(cartao);
    });
    montarMenu();
    if (rolarParaTopo) window.scrollTo(0, 0);
  };

  const atualizarBarra = () => {
    const n = alterados.size;
    $('#barra-salvar').hidden = n === 0;
    $('#barra-texto').textContent = n === 1 ? 'alterações não salvas' : `alterações em ${n} seções`;
  };

  /* ---------- Início ---------- */
  const entrarNoPainel = async () => {
    $('#tela-entrada').hidden = true;
    $('#tela-painel').hidden = false;
    try {
      await carregarDados();
    } catch (e) {
      if (e.status === 401) { sair('seu token expirou ou foi apagado. crie um novo para entrar.'); return; }
      $('#conteudo').innerHTML = '';
      $('#conteudo').append(el('p', 'erro', 'não foi possível carregar o conteúdo. confira sua internet e recarregue a página.'));
      return;
    }
    const inicial = location.hash.slice(1);
    mostrarSecao(secaoPorId(inicial) ? inicial : SECOES[0].id);
    atualizarBarra();
  };

  const sair = (mensagem) => {
    if (!mensagem && !confirm(alterados.size
      ? 'você tem alterações não salvas. sair mesmo assim?'
      : 'sair do painel neste aparelho? para entrar de novo, vai precisar do token.')) return;
    token = '';
    guardarToken(null);
    alterados.clear();
    $('#tela-painel').hidden = true;
    $('#tela-entrada').hidden = false;
    $('#campo-token').value = '';
    const erro = $('#erro-entrada');
    erro.hidden = !mensagem;
    erro.textContent = mensagem || '';
  };

  $('#form-entrada').onsubmit = async (ev) => {
    ev.preventDefault();
    const erro = $('#erro-entrada');
    const botao = ev.target.querySelector('button');
    erro.hidden = true;
    token = $('#campo-token').value.trim();
    botao.disabled = true;
    botao.textContent = 'entrando…';
    try {
      await verificarToken();
      const lembrar = $('#campo-lembrar').checked;
      guardarToken(token, lembrar);
      // Oferece salvar o token no gerenciador de senhas do navegador (Chrome/Android).
      if (lembrar && window.PasswordCredential && navigator.credentials) {
        navigator.credentials.store(new PasswordCredential({ id: 'arqlais', password: token, name: 'Painel do portfólio' })).catch(() => {});
      }
      await entrarNoPainel();
    } catch (e) {
      token = '';
      erro.textContent = e.status === 401 ? 'token inválido. confira se copiou o código inteiro.'
        : e.status === 403 || e.status === 404 ? 'esse token não tem permissão para editar o repositório “portfolio”. veja o passo a passo abaixo.'
        : 'não foi possível conectar. confira sua internet e tente de novo.';
      erro.hidden = false;
    } finally {
      botao.disabled = false;
      botao.textContent = 'entrar';
    }
  };

  $('#botao-sair').onclick = () => sair();
  $('#previa-fechar').onclick = fecharPrevia;
  $('#previa-pdf').onclick = salvarPdf;
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !$('#modal-previa').hidden) fecharPrevia(); });
  $('#botao-salvar').onclick = salvar;
  $('#botao-descartar').onclick = async () => {
    if (!confirm('descartar todas as alterações que ainda não foram salvas?')) return;
    await carregarDados();
    mostrarSecao(secaoAtual);
    atualizarBarra();
  };
  window.addEventListener('hashchange', () => {
    const alvo = location.hash.slice(1);
    if (secaoPorId(alvo) && alvo !== secaoAtual) mostrarSecao(alvo);
  });
  window.addEventListener('beforeunload', (ev) => {
    if (alterados.size) { ev.preventDefault(); ev.returnValue = ''; }
  });

  token = lerToken();
  if (token) entrarNoPainel();
  else $('#tela-entrada').hidden = false;
})();
