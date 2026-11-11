const ICONES = {
  bandeira: '<path d="M5 22V3"/><path d="M5 4h13l-2.5 4.5L18 13H5"/>',
  monitor: '<rect x="2.5" y="3" width="19" height="13" rx="2"/><path d="M8 21h8M12 16v5"/>',
  livro: '<path d="M2 4.5h6.5A3.5 3.5 0 0 1 12 8v13a2.5 2.5 0 0 0-2.5-2.5H2z"/><path d="M22 4.5h-6.5A3.5 3.5 0 0 0 12 8v13a2.5 2.5 0 0 1 2.5-2.5H22z"/>',
  mochila: '<path d="M5 11a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6M8 14h8M9 22v-5h6v5"/>',
  carrinho: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 11.4a2 2 0 0 0 2 1.6h8a2 2 0 0 0 2-1.5L21 7H6"/>',
  trofeu: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
  janela: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M10 13l-2 2 2 2M14 13l2 2-2 2"/>',
  usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  cadeado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  olho: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  lupa: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  baixo: '<path d="M6 9l6 6 6-6"/>',
  direita: '<path d="M9 6l6 6-6 6"/>',
  fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 13l4 4 10-10"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  lixeira: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  entrar: '<path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5M10 17l5-5-5-5M15 12H3"/>',
  hash: '<path d="M5 9h14M5 15h14M10 3L8 21M16 3l-2 18"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  grupo: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14a5 5 0 0 1 5 5"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  prancheta: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h6"/>',
  raio: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  formatura: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 3 9 3 12 0v-5"/>',
  quadro: '<path d="M3 4h18M5 4v10h14V4M12 14v5M9 21l3-2 3 2"/>',
  foguete: '<path d="M14 4c4-2 7-1 7-1s1 3-1 7l-7 7-6-6z"/><path d="M8 16c-1.5 1-2 3-2 5 2 0 4-.5 5-2M9 11l-3-1 2-3 3 1M13 15l1 3 3-2-1-3"/><circle cx="15" cy="9" r="1.5"/>',
  lampada: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1.5 2 1.5 3h5c0-1 .5-2 1.5-3a6 6 0 0 0-4-10z"/>',
  codigo: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  grafico: '<path d="M4 20V10M10 20V4M16 20v-8M21 20H3"/>',
  atualizar: '<path d="M20 11a8 8 0 0 0-14-4M4 4v4h4M4 13a8 8 0 0 0 14 4M20 20v-4h-4"/>',
  copiar: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  salvar: '<path d="M5 3h11l3 3v15H5zM8 3v5h7V3M8 21v-7h8v7"/>',
  baixar: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  tela: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  aviso: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  semwifi: '<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19v.5M3 3l18 18"/>',
  dinheiro: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9a2.5 2 0 0 0-2.5-1.5c-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2A2.5 2 0 0 1 9.5 15M12 6v1.5M12 16.5V18"/>',
  engrenagem: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  sair: '<path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5M16 17l5-5-5-5M21 12H9"/>',
  clipe: '<path d="M20 12l-8 8a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8"/>',
  escudo: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  sino: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
  pontos: '<circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>',
  grade: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
  lista: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  estrela: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  esquerda: '<path d="M15 6l-6 6 6 6"/>',
  upload: '<path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1-.5 9.5z"/><path d="M12 12v6M9 14l3-3 3 3"/>',
  arquivo: '<path d="M6 2h8l5 5v15H6z"/><path d="M14 2v5h5M9 13h6M9 17h6"/>',
  voltar: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  imagem: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-8 8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
  ordenada: '<path d="M10 6h10M10 12h10M10 18h10M4 5h1.5v4M4 11h2.5l-2.500 3H7M4 17h2.500v1H4.500v1H7"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
  enviar: '<path d="M21 3L3 11l7 3 3 7z"/><path d="M21 3L10 14"/>',
  marcador: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  pasta: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  reticencias: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="12" r="0.8"/><circle cx="12" cy="12" r="0.8"/><circle cx="16" cy="12" r="0.8"/>',
  mais3: '<path d="M12 5v14M5 12h14"/>',
  chama: '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-7 1 1 1 2 2 3 1-2 1-5 1-8z"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};

const ICONES_COR = {
  google: '<path fill="#4285F4" d="M23 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-4.9 3.4-8.4z"/><path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21.6 7.6 24 12 24z"/><path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6z"/><path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3A12 12 0 0 0 1.8 7.1l3.8 3c.9-2.7 3.4-5.3 6.4-5.3z"/>',
  moeda: '<circle cx="12" cy="12" r="10" fill="#f2a413"/><circle cx="12" cy="12" r="7" fill="none" stroke="#ffd66b" stroke-width="1.4"/><text x="12" y="15.5" font-size="9" font-weight="700" text-anchor="middle" fill="#fff3c4" font-family="Arial">$</text>',
  xp: '<path d="M12 2l8.5 4.9v10.2L12 22l-8.5-4.9V6.9z" fill="#0d2d73" stroke="#2f7bff" stroke-width="1.6"/><text x="12" y="15" font-size="7" font-weight="700" text-anchor="middle" fill="#8fc0ff" font-family="Arial">XP</text>'
};

function icone(nome, tamanho) {
  const t = tamanho || 20;
  if (ICONES_COR[nome]) {
    return '<svg class="ic" width="' + t + '" height="' + t + '" viewBox="0 0 24 24">' + ICONES_COR[nome] + '</svg>';
  }
  return '<svg class="ic" width="' + t + '" height="' + t + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICONES[nome] + '</svg>';
}

function cristal(cor, clara) {
  return '<path d="M32 4l16 14-6 36H22l-6-36z" fill="' + cor + '"/><path d="M32 4l16 14H16z" fill="' + clara + '"/><path d="M32 18v36" stroke="#ffffff55" stroke-width="2"/>';
}

const ARTES = {
  lampada: '<circle cx="32" cy="27" r="16" fill="#ffc83d"/><path d="M26 39h12v7a6 6 0 0 1-12 0z" fill="#9aa4b8"/><path d="M26 42h12M26 45h12" stroke="#5b6478"/><path d="M26 27a6 6 0 0 1 6-6" stroke="#fff6c9" stroke-width="3" fill="none" stroke-linecap="round"/>',
  papiro: '<rect x="12" y="18" width="40" height="28" rx="4" fill="#dcbd8e"/><rect x="8" y="14" width="10" height="36" rx="5" fill="#b98a4e"/><rect x="46" y="14" width="10" height="36" rx="5" fill="#b98a4e"/><path d="M22 26h22M22 32h22M22 38h14" stroke="#8a6a3a" stroke-width="2"/>',
  escudo: '<path d="M32 6l20 7v16c0 14-9 24-20 29C21 53 12 43 12 29V13z" fill="#2f6fd6"/><path d="M32 12l14 5v12c0 10-6 17-14 21z" fill="#4a93f0"/><path d="M32 12v38" stroke="#1d4fa3" stroke-width="2"/>',
  bateria: '<rect x="20" y="10" width="24" height="46" rx="5" fill="#4b3a8f"/><rect x="26" y="5" width="12" height="7" rx="2" fill="#9aa4b8"/><path d="M34 20l-8 14h6l-2 12 10-16h-6z" fill="#ffd23d"/>',
  cristal: cristal('#2a74e8', '#6fb1ff'),
  cristalroxo: cristal('#8a3fd8', '#c08bff'),
  chave: '<circle cx="22" cy="22" r="11" fill="none" stroke="#f0b323" stroke-width="7"/><path d="M30 30l22 22M42 42l7-7M48 48l6-6" stroke="#f0b323" stroke-width="7" stroke-linecap="round"/>',
  moeda: '<circle cx="32" cy="32" r="24" fill="#f2a413"/><circle cx="32" cy="32" r="19" fill="none" stroke="#ffd66b" stroke-width="3"/><text x="32" y="40" font-size="20" font-weight="700" text-anchor="middle" fill="#ffe9a8" font-family="Arial">XP</text>',
  livro: '<rect x="14" y="8" width="38" height="48" rx="4" fill="#1f8a52"/><rect x="14" y="8" width="7" height="48" fill="#176b40"/><text x="37" y="40" font-size="26" font-weight="700" text-anchor="middle" fill="#f5c542" font-family="Arial">C</text><rect x="22" y="52" width="30" height="4" fill="#e8e1c8"/>',
  foguete: '<path d="M32 4c10 8 12 22 8 36H24C20 26 22 12 32 4z" fill="#e8edf7"/><circle cx="32" cy="22" r="5" fill="#3a8bff"/><path d="M24 34l-9 10 9-2zM40 34l9 10-9-2z" fill="#e04b4b"/><path d="M27 42h10l-5 14z" fill="#ff9d2e"/>',
  caneca: '<path d="M14 16h30v26a10 10 0 0 1-10 10H24a10 10 0 0 1-10-10z" fill="#233b87"/><path d="M44 22h4a6 6 0 0 1 0 14h-4" fill="none" stroke="#233b87" stroke-width="5"/><text x="29" y="40" font-size="14" font-weight="700" text-anchor="middle" fill="#6fb7ff" font-family="monospace">&lt;/&gt;</text>',
  coroa: '<path d="M8 46l4-26 12 12 8-16 8 16 12-12 4 26z" fill="#f2b21c"/><rect x="8" y="46" width="48" height="8" rx="2" fill="#d99a0b"/><circle cx="32" cy="38" r="4" fill="#3a8bff"/>',
  codigo: '<rect x="6" y="10" width="52" height="44" rx="6" fill="#1a2238"/><circle cx="14" cy="17" r="2" fill="#ff5f56"/><circle cx="21" cy="17" r="2" fill="#ffbd2e"/><circle cx="28" cy="17" r="2" fill="#3a8bff"/><path d="M24 30l-6 6 6 6M40 30l6 6-6 6M35 28l-6 16" stroke="#cfd8ee" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  programacao: '<rect x="8" y="8" width="48" height="48" rx="10" fill="#3b3f9e"/><text x="32" y="42" font-size="26" font-weight="700" text-anchor="middle" fill="#d6dcff" font-family="Arial">{ }</text>',
  computador: '<rect x="12" y="14" width="40" height="28" rx="3" fill="#2f4f9e"/><rect x="16" y="18" width="32" height="20" fill="#7fb2ff"/><path d="M6 46h52l-4 6H10z" fill="#9aa4b8"/>',
  robotica: '<rect x="14" y="16" width="36" height="30" rx="7" fill="#33478f"/><circle cx="25" cy="30" r="4" fill="#7fe3ff"/><circle cx="39" cy="30" r="4" fill="#7fe3ff"/><path d="M26 40h12" stroke="#7fe3ff" stroke-width="2"/><path d="M32 16V8" stroke="#9aa4b8" stroke-width="3"/><circle cx="32" cy="7" r="3" fill="#ff5f56"/><rect x="18" y="48" width="28" height="8" rx="3" fill="#22336b"/>'
};
ARTES.cerebro = '<g fill="none" stroke="#1fb5b5" stroke-width="3" stroke-linecap="round"><path d="M32 12v40"/><path d="M32 18c-3-7-14-6-15 2-6 1-8 9-3 13-2 5 3 11 9 9 2 4 8 4 9-1"/><path d="M32 18c3-7 14-6 15 2 6 1 8 9 3 13 2 5-3 11-9 9-2 4-8 4-9-1"/><path d="M22 28c4 0 6 3 10 3M42 28c-4 0-6 3-10 3"/></g>';
ARTES.raioazul = '<path d="M36 4L14 36h14l-4 24 26-34H34z" fill="#1fa7b5"/><path d="M36 4L14 36h14z" fill="#35c8d4"/>';
ARTES.bandeira = '<rect x="14" y="8" width="5" height="50" fill="#b9791e"/><path d="M19 12h32l-8 12 8 12H19z" fill="#c8861a"/><path d="M19 12h32l-3 5H19z" fill="#e3a43c"/>';
ARTES.escudocadeado = '<path d="M32 6l20 7v16c0 14-9 24-20 29C21 53 12 43 12 29V13z" fill="#27637a"/><path d="M32 12l14 5v12c0 10-6 17-14 21z" fill="#3c8aa8"/><rect x="23" y="30" width="18" height="14" rx="2" fill="#e8f3ff"/><path d="M27 30v-5a5 5 0 0 1 10 0v5" fill="none" stroke="#e8f3ff" stroke-width="3"/><circle cx="32" cy="37" r="2" fill="#27637a"/>';
ARTES.inovacao = ARTES.lampada;

function arte(nome) {
  return '<svg class="arte" viewBox="0 0 64 64">' + (ARTES[nome] || ARTES.lampada) + '</svg>';
}

for (const elemento of document.querySelectorAll('[data-icone]')) {
  elemento.innerHTML = icone(elemento.dataset.icone, elemento.dataset.tam);
}
for (const elemento of document.querySelectorAll('[data-arte]')) {
  elemento.innerHTML = arte(elemento.dataset.arte);
}
