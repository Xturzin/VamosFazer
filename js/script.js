'use strict';

// =============================================
// ESTADO CENTRAL
// =============================================
var estado = {
   tarefas:               [],
   filtroAtivo:           'todas',
   prioridadeSelecionada: 'media',
   vencimentoSelecionado: null,
   notasSelecionadas:     '',
   tarefaEmEdicao:        null,
   deletandoId:           null,
   idTarefaRecemCriada:   null,
   celebrouConclusao:     false,
   buscaAtiva:            '',
   ordenacao:             'recente',
   arrastandoId:          null,
   sobreId:               null,
   sobrePosicao:          null,
   selecao:               new Set(),
   modoSelecao:           false,
   cardFocadoId:          null,
   viewAtual:             'lista'   // 'lista' | 'calendario'
};

var tarefaParaUndo      = null;
var undoTimeout         = null;
var longPressTimer      = null;
var longPressCardId     = null;
var dadosParaImportar   = null;
var installPromptEvent  = null;
var buscaTimeout        = null;
var elementoAntesDoModal = null;

// =============================================
// REFERÊNCIAS DO DOM
// Usa função para buscar no momento do uso,
// pois a view pode ser trocada dinamicamente.
// =============================================
function el(id) { return document.getElementById(id); }
function qs(sel) { return document.querySelector(sel); }

// Referências estáticas (nunca são substituídas pelo troca de view)
var elsEstaticos = {
   sidebar:             null,
   menuToggle:          null,
   toastContainer:      null,
   ariaAnuncio:         null,
   acaoLote:            null,
   acaoLoteCount:       null,
   btnLoteCancelar:     null,
   btnLoteSelecionarTodas: null,
   btnLoteConcluir:     null,
   btnLoteDeletar:      null,
   modalOverlay:        null,
   modalTitle:          null,
   inputTitulo:         null,
   inputVencimento:     null,
   btnLimparVencimento: null,
   vencimentoPresets:   null,
   inputNotas:          null,
   btnFecharModal:      null,
   btnCancelar:         null,
   btnCriarTarefa:      null,
   prioridadeBtns:      null,
   navItems:            null,
   btnTema:             null,
   btnAtalhos:          null,
   btnExportar:         null,
   exportMenu:          null,
   btnExportJson:       null,
   btnExportCsv:        null,
   btnImportar:         null,
   inputImportar:       null,
   shortcutsOverlay:    null,
   btnFecharShortcuts:  null,
   modalImportar:       null,
   btnFecharImportar:   null,
   btnCancelarImportar: null,
   btnConfirmarImportar:null,
   importPreview:       null,
   importOpcoes:        null,
   btnInstalarPwa:      null,
   charCounter:         null,
   notifPrompt:         null,
   notifPromptTexto:    null,
   btnAtivarNotif:      null,
   btnFecharNotif:      null,
   sidebarUsername:     null,
   sidebarAvatar:       null,
   sidebarUser:         null,
   modalPerfil:         null,
   btnFecharPerfil:     null,
   btnCancelarPerfil:   null,
   btnSalvarPerfil:     null,
   btnPerfilLogout:     null,
   btnTrocarAvatar:     null,
   inputAvatar:         null,
   inputPerfilNome:     null,
   inputPerfilEmail:    null,
   inputPerfilSenhaAtual: null,
   btnToggleSenha:        null,
   perfilSenhaCampos:     null,
   inputPerfilSenha:    null,
   inputPerfilSenha2:   null,
   perfilAvatarPreview: null
};

// Referências dinâmicas (vivem dentro da view atual)
var elsDin = {
   mainTitle:           null,
   mainSubtitle:        null,
   btnNovaTarefa:       null,
   listaTarefas:        null,
   searchInput:         null,
   searchClear:         null,
   statsBar:            null,
   progressoContainer:  null,
   progressoBar:        null,
   progressoPct:        null,
   badgeTodas:          null,
   badgeHoje:           null,
   badgePendentes:      null,
   badgeConcluidas:     null,
   badgeVencidas:       null
};

function resolverEls() {
   // Estáticos
   elsEstaticos.sidebar              = el('sidebar');
   elsEstaticos.menuToggle           = el('menu-toggle');
   elsEstaticos.toastContainer       = el('toast-container');
   elsEstaticos.ariaAnuncio          = el('aria-anuncio');
   elsEstaticos.acaoLote             = el('acao-lote');
   elsEstaticos.acaoLoteCount        = el('acao-lote-count');
   elsEstaticos.btnLoteCancelar      = el('btn-lote-cancelar');
   elsEstaticos.btnLoteSelecionarTodas = el('btn-lote-selecionar-todas');
   elsEstaticos.btnLoteConcluir      = el('btn-lote-concluir');
   elsEstaticos.btnLoteDeletar       = el('btn-lote-deletar');
   elsEstaticos.modalOverlay         = el('modal-nova-tarefa');
   elsEstaticos.modalTitle           = el('modal-title');
   elsEstaticos.inputTitulo          = el('input-titulo');
   elsEstaticos.inputVencimento      = el('input-vencimento');
   elsEstaticos.btnLimparVencimento  = el('btn-limpar-vencimento');
   elsEstaticos.vencimentoPresets    = document.querySelectorAll('.vencimento-preset');
   elsEstaticos.inputNotas           = el('input-notas');
   elsEstaticos.btnFecharModal       = el('btn-fechar-modal');
   elsEstaticos.btnCancelar          = el('btn-cancelar');
   elsEstaticos.btnCriarTarefa       = el('btn-criar-tarefa');
   elsEstaticos.prioridadeBtns       = document.querySelectorAll('.prioridade-btn');
   elsEstaticos.navItems             = document.querySelectorAll('.sidebar__nav-item');
   elsEstaticos.btnTema              = el('btn-tema');
   elsEstaticos.btnAtalhos           = el('btn-atalhos');
   elsEstaticos.btnExportar          = el('btn-exportar');
   elsEstaticos.exportMenu           = el('export-menu');
   elsEstaticos.btnExportJson        = el('btn-export-json');
   elsEstaticos.btnExportCsv         = el('btn-export-csv');
   elsEstaticos.btnImportar          = el('btn-importar');
   elsEstaticos.inputImportar        = el('input-importar');
   elsEstaticos.shortcutsOverlay     = el('shortcuts-overlay');
   elsEstaticos.btnFecharShortcuts   = el('btn-fechar-shortcuts');
   elsEstaticos.modalImportar        = el('modal-importar');
   elsEstaticos.btnFecharImportar    = el('btn-fechar-importar');
   elsEstaticos.btnCancelarImportar  = el('btn-cancelar-importar');
   elsEstaticos.btnConfirmarImportar = el('btn-confirmar-importar');
   elsEstaticos.importPreview        = el('import-preview');
   elsEstaticos.importOpcoes         = el('import-opcoes');
   elsEstaticos.btnInstalarPwa       = el('btn-instalar-pwa');
   elsEstaticos.charCounter          = el('char-counter');
   elsEstaticos.notifPrompt          = el('notif-prompt');
   elsEstaticos.notifPromptTexto     = el('notif-prompt-texto');
   elsEstaticos.btnAtivarNotif       = el('btn-ativar-notif');
   elsEstaticos.btnFecharNotif       = el('btn-fechar-notif');
   elsEstaticos.sidebarUsername      = qs('.sidebar__username');
   elsEstaticos.sidebarAvatar        = qs('.sidebar__avatar');
   elsEstaticos.sidebarUser          = qs('.sidebar__user');
   elsEstaticos.modalPerfil          = el('modal-perfil');
   elsEstaticos.btnFecharPerfil      = el('btn-fechar-perfil');
   elsEstaticos.btnCancelarPerfil    = el('btn-cancelar-perfil');
   elsEstaticos.btnSalvarPerfil      = el('btn-salvar-perfil');
   elsEstaticos.btnPerfilLogout      = el('btn-perfil-logout');
   elsEstaticos.btnTrocarAvatar      = el('btn-trocar-avatar');
   elsEstaticos.inputAvatar          = el('input-avatar');
   elsEstaticos.inputPerfilNome      = el('input-perfil-nome');
   elsEstaticos.inputPerfilEmail     = el('input-perfil-email');
   elsEstaticos.inputPerfilSenhaAtual = el('input-perfil-senha-atual');
   elsEstaticos.btnToggleSenha        = el('btn-toggle-senha');
   elsEstaticos.perfilSenhaCampos     = el('perfil-senha-campos');
   elsEstaticos.inputPerfilSenha     = el('input-perfil-senha');
   elsEstaticos.inputPerfilSenha2    = el('input-perfil-senha2');
   elsEstaticos.perfilAvatarPreview  = el('perfil-avatar-preview');
   // Badges — ficam na sidebar, são estáticos
   elsDin.badgeTodas      = el('badge-todas');
   elsDin.badgeHoje       = el('badge-hoje');
   elsDin.badgePendentes  = el('badge-pendentes');
   elsDin.badgeConcluidas = el('badge-concluidas');
   elsDin.badgeVencidas   = el('badge-vencidas');
}

function resolverElsDinamicos() {
   elsDin.mainTitle          = el('main-title');
   elsDin.mainSubtitle       = el('main-subtitle');
   elsDin.btnNovaTarefa      = el('btn-nova-tarefa');
   elsDin.listaTarefas       = el('lista-tarefas');
   elsDin.searchInput        = el('search-input');
   elsDin.searchClear        = el('search-clear');
   elsDin.statsBar           = el('stats-bar');
   elsDin.progressoContainer = el('progresso-container');
   elsDin.progressoBar       = el('progresso-bar');
   elsDin.progressoPct       = el('progresso-pct');
}

// =============================================
// TEMA
// =============================================
function obterTemaAtual() {
   return document.documentElement.getAttribute('data-theme') || 'light';
}

function aplicarTema(tema) {
   document.documentElement.setAttribute('data-theme', tema);
   localStorage.setItem('vf-tema', tema);
   var meta = document.querySelector('meta[name="theme-color"]');
   if (meta) meta.content = tema === 'dark' ? '#0E0B07' : '#7339D4';
}

function toggleTema() {
   aplicarTema(obterTemaAtual() === 'dark' ? 'light' : 'dark');
   anunciar('Tema alternado.');
}

// =============================================
// PERSISTÊNCIA LOCAL
// =============================================
function salvarTarefasLocal() {
   try { localStorage.setItem('vamos-fazer-tarefas', JSON.stringify(estado.tarefas)); }
   catch(e) { mostrarToast('Armazenamento cheio.', 'erro'); }
}

function carregarTarefasLocal() {
   try {
      var d = localStorage.getItem('vamos-fazer-tarefas');
      if (d) estado.tarefas = JSON.parse(d);
   } catch(e) { estado.tarefas = []; }
}

// salvarTarefas: salva local + sincroniza com Supabase em background
function salvarTarefas() {
   salvarTarefasLocal();
   if (window.Sync && window.authEstado && window.authEstado.usuario) {
      window.Sync.sincronizarLote(estado.tarefas);
   }
}

// =============================================
// UTILITÁRIOS
// =============================================
function capitalizar(t) {
   return t.charAt(0).toUpperCase() + t.slice(1);
}

function formatarData(dataISO) {
   var hoje = new Date().toISOString().slice(0, 10);
   if (dataISO === hoje) return 'Hoje';
   var data = new Date(dataISO + 'T00:00:00');
   return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function escaparHtml(str) {
   return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
}

function destacarTexto(texto, busca) {
   var escapado = escaparHtml(texto);
   if (!busca) return escapado;
   var bEsc  = busca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   var regex = new RegExp('(' + bEsc + ')', 'gi');
   return escapado.replace(regex, '<mark class="destaque">$1</mark>');
}

function anunciar(msg) {
   var el = elsEstaticos.ariaAnuncio;
   if (!el) return;
   el.textContent = '';
   requestAnimationFrame(function() { el.textContent = msg; });
}

function calcularData(diasOffset) {
   var d = new Date();
   d.setDate(d.getDate() + diasOffset);
   return d.toISOString().slice(0, 10);
}

function autoResizeTextarea(el) {
   if (!el) return;
   el.style.height = 'auto';
   el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}

// =============================================
// VENCIMENTO
// =============================================
function classificarVencimento(v) {
   if (!v) return null;
   var hoje = new Date().toISOString().slice(0, 10);
   if (v < hoje) return 'vencida';
   if (v === hoje) return 'hoje';
   var ms   = new Date(v + 'T00:00:00').getTime() - new Date(hoje + 'T00:00:00').getTime();
   return Math.round(ms / 86400000) <= 2 ? 'em-breve' : 'normal';
}

function formatarVencimento(v) {
   if (!v) return null;
   var hoje  = new Date().toISOString().slice(0, 10);
   var msH   = new Date(hoje + 'T00:00:00').getTime();
   var msV   = new Date(v + 'T00:00:00').getTime();
   var dias  = Math.round((msV - msH) / 86400000);
   if (v < hoje) {
      var atras = Math.round((msH - msV) / 86400000);
      return atras === 1 ? 'Venceu ontem' : 'Venceu há ' + atras + ' dias';
   }
   if (v === hoje) return 'Vence hoje';
   if (dias === 1) return 'Amanhã';
   if (dias <= 7)  return 'Em ' + dias + ' dias';
   return new Date(v + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function svgVencimento(c) {
   if (c === 'vencida' || c === 'hoje') {
      return '<svg class="meta-icon" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1.2"/><path d="M5 3v2.5l1.5 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
   }
   return '<svg class="meta-icon" width="10" height="10" viewBox="0 0 10 11" fill="none" aria-hidden="true"><rect x="1" y="2" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.1"/><path d="M1 5h8" stroke="currentColor" stroke-width="1.1"/><path d="M3 1v2M7 1v2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>';
}

function htmlVencimento(tarefa) {
   if (!tarefa.vencimento) return '';
   var c = classificarVencimento(tarefa.vencimento);
   return '<span class="meta-sep" aria-hidden="true">·</span><span class="meta-vencimento meta-vencimento--' + c + '">' + svgVencimento(c) + formatarVencimento(tarefa.vencimento) + '</span>';
}

// =============================================
// TOASTS
// =============================================
function mostrarToast(msg, tipo, acao) {
   tipo = tipo || 'sucesso';
   var container = elsEstaticos.toastContainer;
   if (!container) return;
   var toast = document.createElement('div');
   toast.className = 'toast toast--' + tipo;
   if (acao) {
      toast.classList.add('toast--com-acao');
      toast.innerHTML = '<span class="toast__msg">' + escaparHtml(msg) + '</span><button class="toast__acao">' + escaparHtml(acao.label) + '</button>';
      toast.querySelector('.toast__acao').addEventListener('click', function() {
         acao.callback();
         toast.classList.remove('toast--visivel');
         setTimeout(function() { toast.remove(); }, 300);
      });
   } else {
      toast.textContent = msg;
   }
   container.appendChild(toast);
   requestAnimationFrame(function() {
      requestAnimationFrame(function() { toast.classList.add('toast--visivel'); });
   });
   var dur = acao ? 5000 : 2500;
   setTimeout(function() {
      toast.classList.remove('toast--visivel');
      setTimeout(function() { toast.remove(); }, 300);
   }, dur);
}

// =============================================
// FILTRO + BUSCA + ORDENAÇÃO
// =============================================
var PRIO_PESO = { alta: 0, media: 1, baixa: 2 };

function obterTarefasFiltradas() {
   var hoje     = new Date().toISOString().slice(0, 10);
   var resultado = estado.tarefas.slice();

   switch (estado.filtroAtivo) {
      case 'hoje':      resultado = resultado.filter(function(t) { return t.criadaEm === hoje; }); break;
      case 'pendentes': resultado = resultado.filter(function(t) { return !t.concluida; }); break;
      case 'concluidas':resultado = resultado.filter(function(t) { return t.concluida; }); break;
      case 'vencidas':  resultado = resultado.filter(function(t) { return !t.concluida && t.vencimento && t.vencimento < hoje; }); break;
   }

   if (estado.buscaAtiva) {
      var q = estado.buscaAtiva.toLowerCase();
      resultado = resultado.filter(function(t) {
         return t.titulo.toLowerCase().indexOf(q) >= 0 ||
                (t.notas && t.notas.toLowerCase().indexOf(q) >= 0);
      });
   }

   switch (estado.ordenacao) {
      case 'prioridade':
         resultado.sort(function(a, b) { return PRIO_PESO[a.prioridade] - PRIO_PESO[b.prioridade]; });
         break;
      case 'vencimento':
         resultado.sort(function(a, b) {
            if (!a.vencimento && !b.vencimento) return 0;
            if (!a.vencimento) return 1;
            if (!b.vencimento) return -1;
            return a.vencimento < b.vencimento ? -1 : 1;
         });
         break;
      case 'nome':
         resultado.sort(function(a, b) { return a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' }); });
         break;
   }
   return resultado;
}

// =============================================
// ESTATÍSTICAS
// =============================================
function atualizarStats() {
   var statsBar = elsDin.statsBar;
   if (!statsBar) return;
   var hoje = new Date().toISOString().slice(0, 10);
   var t    = estado.tarefas;
   var total = t.length;
   if (total === 0) { statsBar.innerHTML = ''; return; }
   var concluidas  = t.filter(function(x) { return x.concluida; }).length;
   var pct         = Math.round((concluidas / total) * 100);
   var vendemHoje  = t.filter(function(x) { return !x.concluida && x.vencimento === hoje; }).length;
   var comNotas    = t.filter(function(x) { return x.notas && x.notas.trim(); }).length;
   var html = '<span class="stats-item stats-item--destaque">' + total + ' ' + (total === 1 ? 'tarefa' : 'tarefas') + '</span>' +
              '<span class="stats-sep-linha" aria-hidden="true">·</span>' +
              '<span class="stats-item">' + pct + '% concluídas</span>';
   if (vendemHoje > 0) html += '<span class="stats-sep-linha" aria-hidden="true">·</span><span class="stats-item stats-item--alerta">' + vendemHoje + ' ' + (vendemHoje === 1 ? 'vence hoje' : 'vencem hoje') + '</span>';
   if (comNotas > 0)   html += '<span class="stats-sep-linha" aria-hidden="true">·</span><span class="stats-item">' + comNotas + ' com notas</span>';
   statsBar.innerHTML = html;
}

// =============================================
// EMPTY STATES
// =============================================
var EMPTY_STATES = {
   todas:     { svg: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 6h14M3 10h14M3 14h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>', titulo: 'Nada aqui ainda', sub: 'Pressione N ou clique em "+ Nova Tarefa" para começar.' },
   hoje:      { svg: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/><circle cx="10" cy="10" r="2.5" fill="currentColor"/></svg>', titulo: 'Nada para hoje', sub: 'Que tal adicionar algo para fazer hoje?' },
   pendentes: { svg: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M10 6.5v3.5l2.5 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>', titulo: 'Tudo em dia', sub: 'Nenhuma tarefa pendente por enquanto.' },
   concluidas:{ svg: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M7 10l2.5 2.5 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>', titulo: 'Nada concluído ainda', sub: 'Conclua algumas tarefas e elas aparecerão aqui.' },
   vencidas:  { svg: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M10 7v3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="10" cy="13.5" r=".8" fill="currentColor"/></svg>', titulo: 'Nenhuma tarefa vencida', sub: 'Ótimo — tudo está dentro do prazo.' },
   busca:     { svg: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.4"/><path d="M14 14l3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>', titulo: 'Nenhum resultado', sub: '' }
};

// =============================================
// SVGs REUTILIZADOS
// =============================================
var SVG_CAL    = '<svg class="meta-icon" width="9" height="9" viewBox="0 0 10 11" fill="none" aria-hidden="true"><rect x="1" y="2" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M1 5h8" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 1v2M6.5 1v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
var SVG_DEL    = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
var SVG_DRAG   = '<svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden="true"><circle cx="3" cy="3" r="1.2" fill="currentColor"/><circle cx="7" cy="3" r="1.2" fill="currentColor"/><circle cx="3" cy="7" r="1.2" fill="currentColor"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/><circle cx="3" cy="11" r="1.2" fill="currentColor"/><circle cx="7" cy="11" r="1.2" fill="currentColor"/></svg>';
var SVG_CHKSEL = '<svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var SVG_NOTAS  = '<svg width="9" height="10" viewBox="0 0 9 10" fill="none" aria-hidden="true"><path d="M1.5 2.5h6M1.5 5h6M1.5 7.5h3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';

// =============================================
// RENDERIZAÇÃO DE TAREFAS
// =============================================
function renderizarTarefas(stagger) {
   var lista = elsDin.listaTarefas;
   if (!lista) return;
   var filtradas = obterTarefasFiltradas();

   if (estado.buscaAtiva && filtradas.length === 0) {
      var q = escaparHtml(estado.buscaAtiva);
      lista.innerHTML = '<div class="empty-state" role="status"><span class="empty-state__icon" aria-hidden="true">' + EMPTY_STATES.busca.svg + '</span><p class="empty-state__titulo">' + EMPTY_STATES.busca.titulo + '</p><p class="empty-state__sub">Nenhuma tarefa corresponde a &ldquo;' + q + '&rdquo;</p></div>';
      return;
   }
   if (filtradas.length === 0) {
      var es = EMPTY_STATES[estado.filtroAtivo] || EMPTY_STATES.todas;
      lista.innerHTML = '<div class="empty-state" role="status"><span class="empty-state__icon" aria-hidden="true">' + es.svg + '</span><p class="empty-state__titulo">' + es.titulo + '</p><p class="empty-state__sub">' + es.sub + '</p></div>';
      return;
   }

   var isTouch   = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
   var arrastavel= !isTouch && estado.ordenacao === 'recente' && !estado.buscaAtiva;
   var plural    = filtradas.length === 1 ? 'tarefa' : 'tarefas';
   var sorts     = [
      { key: 'recente',    label: 'Recente' },
      { key: 'prioridade', label: 'Prioridade' },
      { key: 'vencimento', label: 'Prazo' },
      { key: 'nome',       label: 'A–Z' }
   ];
   var sortHtml = '<div class="sort-controls" role="group" aria-label="Ordenação">';
   sorts.forEach(function(s, i) {
      sortHtml += '<button class="sort-btn' + (estado.ordenacao === s.key ? ' sort-btn--ativo' : '') + '" data-sort="' + s.key + '" aria-pressed="' + (estado.ordenacao === s.key) + '">' + s.label + '</button>';
      if (i < sorts.length - 1) sortHtml += '<span class="sort-sep" aria-hidden="true">·</span>';
   });
   sortHtml += '</div>';

   var headerHtml = '<div class="tasks__header" role="presentation" aria-hidden="true">' + sortHtml + '<div class="tasks__divider"></div><span class="tasks__count">' + filtradas.length + ' ' + plural + '</span></div>';
   var hoje       = new Date().toISOString().slice(0, 10);

   var cardsHtml = filtradas.map(function(tarefa, i) {
      var stAttr   = stagger ? 'style="--i:' + Math.min(i, 8) + '"' : '';
      var stClass  = stagger ? 'task-card--stagger' : '';
      var titHtml  = destacarTexto(tarefa.titulo, estado.buscaAtiva);
      var isSel    = estado.selecao.has(tarefa.id);
      var isVenc   = !tarefa.concluida && tarefa.vencimento && tarefa.vencimento < hoje;
      var isFoc    = estado.cardFocadoId === tarefa.id;
      var drag     = arrastavel ? '<div class="task-card__drag-handle" aria-hidden="true">' + SVG_DRAG + '</div>' : '';
      var prevNotas= tarefa.notas && tarefa.notas.trim() ? tarefa.notas.trim().slice(0, 80) + (tarefa.notas.length > 80 ? '…' : '') : '';
      var notasInd = prevNotas ? '<span class="meta-sep" aria-hidden="true">·</span><span class="meta-notas" data-preview="' + escaparHtml(prevNotas) + '" aria-label="Tem notas">' + SVG_NOTAS + '</span>' : '';

      return '<div class="task-card ' + stClass + (tarefa.concluida ? ' task-card--done' : '') + (isVenc ? ' task-card--vencida' : '') + (isSel ? ' task-card--selecionado' : '') + (isFoc ? ' task-card--focado' : '') + '" data-id="' + tarefa.id + '" data-prioridade="' + tarefa.prioridade + '" role="listitem"' + (arrastavel ? ' draggable="true"' : '') + ' ' + stAttr + '>' +
         '<div class="task-card__left">' +
            drag +
            '<button class="task-card__sel" data-action="selecionar" data-id="' + tarefa.id + '" aria-label="Selecionar: ' + escaparHtml(tarefa.titulo) + '" aria-pressed="' + isSel + '">' + (isSel ? SVG_CHKSEL : '') + '</button>' +
            '<button class="task-card__check' + (tarefa.concluida ? ' task-card__check--checked' : '') + '" data-action="concluir" data-id="' + tarefa.id + '" aria-label="' + (tarefa.concluida ? 'Desmarcar' : 'Concluir') + ': ' + escaparHtml(tarefa.titulo) + '"></button>' +
            '<div class="task-card__content">' +
               '<button class="task-card__title--btn" data-action="editar" data-id="' + tarefa.id + '" aria-label="Editar: ' + escaparHtml(tarefa.titulo) + '">' + titHtml + '</button>' +
               '<span class="task-card__meta">' + SVG_CAL + formatarData(tarefa.criadaEm) + '<span class="meta-sep" aria-hidden="true">·</span><span class="meta-dot meta-dot--' + tarefa.prioridade + '" aria-hidden="true"></span>' + capitalizar(tarefa.prioridade) + htmlVencimento(tarefa) + notasInd + '</span>' +
            '</div>' +
         '</div>' +
         '<div class="task-card__right">' +
            '<button class="task-card__delete" data-action="deletar" data-id="' + tarefa.id + '" aria-label="Deletar: ' + escaparHtml(tarefa.titulo) + '">' + SVG_DEL + '</button>' +
         '</div>' +
      '</div>';
   }).join('');

   lista.innerHTML = headerHtml + cardsHtml;
   lista.classList.toggle('lista--modo-selecao', estado.modoSelecao);

   if (estado.idTarefaRecemCriada !== null) {
      var novoCard = lista.querySelector('[data-id="' + estado.idTarefaRecemCriada + '"]');
      if (novoCard) {
         novoCard.classList.add('task-card--nova');
         novoCard.addEventListener('animationend', function() { novoCard.classList.remove('task-card--nova'); }, { once: true });
      }
      estado.idTarefaRecemCriada = null;
   }
}

// =============================================
// HEADER + BADGES + PROGRESSO
// =============================================
function atualizarTituloHeader() {
   var t = { todas: 'Todas as Tarefas', hoje: 'Hoje', pendentes: 'Em Progresso', concluidas: 'Concluídas', vencidas: 'Vencidas', calendario: 'Calendário' };
   if (elsDin.mainTitle)    elsDin.mainTitle.textContent    = t[estado.filtroAtivo] || 'Tarefas';
   if (elsDin.mainSubtitle) {
      var n = estado.tarefas.filter(function(x) { return !x.concluida; }).length;
      elsDin.mainSubtitle.textContent = n === 0 ? 'Nenhuma tarefa pendente' : n === 1 ? '1 tarefa pendente' : n + ' tarefas pendentes';
   }
}

function atualizarBadge(elRef, valor) {
   if (!elRef) return;
   var txt = valor ? String(valor) : '';
   if (elRef.textContent === txt) return;
   elRef.textContent = txt;
   if (!txt) return;
   requestAnimationFrame(function() {
      elRef.classList.add('nav-badge--pop');
      elRef.addEventListener('animationend', function() { elRef.classList.remove('nav-badge--pop'); }, { once: true });
   });
}

function atualizarBadges() {
   var hoje = new Date().toISOString().slice(0, 10);
   var t    = estado.tarefas;
   atualizarBadge(elsDin.badgeTodas,     t.length);
   atualizarBadge(elsDin.badgeHoje,      t.filter(function(x) { return x.criadaEm === hoje; }).length);
   atualizarBadge(elsDin.badgePendentes, t.filter(function(x) { return !x.concluida; }).length);
   atualizarBadge(elsDin.badgeConcluidas,t.filter(function(x) { return x.concluida; }).length);
   atualizarBadge(elsDin.badgeVencidas,  t.filter(function(x) { return !x.concluida && x.vencimento && x.vencimento < hoje; }).length);
}

function atualizarProgresso() {
   var pc = elsDin.progressoContainer;
   var pb = elsDin.progressoBar;
   var pp = elsDin.progressoPct;
   if (!pc || !pb || !pp) return;
   var total = estado.tarefas.length;
   if (total === 0) {
      pc.classList.remove('visivel'); pb.style.width = '0%'; pb.classList.remove('progresso-bar--completo');
      pp.classList.remove('visivel'); pp.textContent = ''; pc.setAttribute('aria-valuenow', '0');
      estado.celebrouConclusao = false; return;
   }
   var conc = estado.tarefas.filter(function(t) { return t.concluida; }).length;
   var pct  = Math.round((conc / total) * 100);
   pc.classList.add('visivel'); pb.style.width = pct + '%';
   pc.setAttribute('aria-valuenow', pct); pp.classList.add('visivel'); pp.textContent = pct + '%';
   if (pct === 100) {
      pb.classList.add('progresso-bar--completo');
      if (!estado.celebrouConclusao) { mostrarToast('Todas as tarefas concluídas.', 'sucesso'); estado.celebrouConclusao = true; }
   } else {
      pb.classList.remove('progresso-bar--completo'); estado.celebrouConclusao = false;
   }
}

function sincronizarEstado(cfg) {
   cfg = cfg || {};
   atualizarTituloHeader();
   atualizarBadges();
   if (estado.viewAtual === 'lista') {
      atualizarProgresso();
      atualizarStats();
      if (!cfg.somenteHeader) renderizarTarefas(cfg.stagger || false);
   }
}

// =============================================
// VENCIMENTO NO MODAL
// =============================================
function atualizarVencimentoModal(dataISO) {
   estado.vencimentoSelecionado = dataISO || null;
   var iv = elsEstaticos.inputVencimento;
   var bl = elsEstaticos.btnLimparVencimento;
   var ps = elsEstaticos.vencimentoPresets;
   if (iv) iv.value = dataISO || '';
   var tem = !!dataISO;
   if (bl) { bl.classList.toggle('visivel', tem); bl.setAttribute('tabindex', tem ? '0' : '-1'); }
   if (ps) ps.forEach(function(btn) {
      var dBtn = calcularData(Number(btn.dataset.dias));
      var ativo = dataISO === dBtn;
      btn.classList.toggle('vencimento-preset--ativo', ativo);
      btn.setAttribute('aria-pressed', String(ativo));
   });
}

// =============================================
// MODAL — ABRIR / FECHAR
// =============================================
function abrirModal() {
   elementoAntesDoModal = document.activeElement;
   var mo = elsEstaticos.modalOverlay;
   if (mo) mo.classList.add('is-open');
   setTimeout(function() {
      var it = elsEstaticos.inputTitulo;
      if (it) it.focus();
   }, 60);
}

function abrirEdicao(id) {
   var tarefa = estado.tarefas.filter(function(t) { return t.id === id; })[0];
   if (!tarefa) return;
   estado.tarefaEmEdicao        = id;
   estado.prioridadeSelecionada = tarefa.prioridade;
   var mt = elsEstaticos.modalTitle;
   var bc = elsEstaticos.btnCriarTarefa;
   var it = elsEstaticos.inputTitulo;
   var nt = elsEstaticos.inputNotas;
   if (mt) mt.textContent = 'Editar Tarefa';
   if (bc) bc.textContent = 'Salvar';
   if (it) { it.value = tarefa.titulo; atualizarContador(); }
   if (nt) { nt.value = tarefa.notas || ''; autoResizeTextarea(nt); }
   var pbs = elsEstaticos.prioridadeBtns;
   if (pbs) pbs.forEach(function(btn) {
      var ativo = btn.dataset.valor === tarefa.prioridade;
      btn.classList.toggle('prioridade-btn--ativo', ativo);
      btn.setAttribute('aria-pressed', String(ativo));
   });
   atualizarVencimentoModal(tarefa.vencimento || null);
   elementoAntesDoModal = document.activeElement;
   var mo = elsEstaticos.modalOverlay;
   if (mo) mo.classList.add('is-open');
   setTimeout(function() {
      var it2 = elsEstaticos.inputTitulo;
      if (it2) { it2.focus(); it2.select(); }
   }, 60);
}

function fecharModal() {
   var mo = elsEstaticos.modalOverlay;
   var it = elsEstaticos.inputTitulo;
   var nt = elsEstaticos.inputNotas;
   var mt = elsEstaticos.modalTitle;
   var bc = elsEstaticos.btnCriarTarefa;
   var pbs= elsEstaticos.prioridadeBtns;
   if (mo) mo.classList.remove('is-open');
   if (it) { it.value = ''; it.classList.remove('modal__input--erro', 'modal__input--shake'); atualizarContador(); }
   if (nt) { nt.value = ''; nt.style.height = ''; }
   estado.tarefaEmEdicao        = null;
   estado.prioridadeSelecionada = 'media';
   if (mt) mt.textContent = 'Nova Tarefa';
   if (bc) bc.textContent = 'Criar Tarefa';
   if (pbs) pbs.forEach(function(btn) {
      var isMedia = btn.dataset.valor === 'media';
      btn.classList.toggle('prioridade-btn--ativo', isMedia);
      btn.setAttribute('aria-pressed', isMedia ? 'true' : 'false');
   });
   atualizarVencimentoModal(null);
   if (elementoAntesDoModal) { elementoAntesDoModal.focus(); elementoAntesDoModal = null; }
   if (estado.viewAtual === 'calendario') { renderizarCalendario(); }
}

// =============================================
// CRUD
// =============================================
function criarTarefa() {
   var it = elsEstaticos.inputTitulo;
   var nt = elsEstaticos.inputNotas;
   var titulo = it ? it.value.trim() : '';
   var notas  = nt ? nt.value.trim() : '';

   if (!titulo) {
      if (!it) return;
      it.focus();
      it.classList.remove('modal__input--shake');
      requestAnimationFrame(function() { it.classList.add('modal__input--erro', 'modal__input--shake'); });
      it.addEventListener('animationend', function() { it.classList.remove('modal__input--shake'); }, { once: true });
      return;
   }

   if (estado.tarefaEmEdicao !== null) {
      var eid = estado.tarefaEmEdicao;
      estado.tarefas = estado.tarefas.map(function(t) {
         if (t.id !== eid) return t;
         return Object.assign({}, t, { titulo: titulo, prioridade: estado.prioridadeSelecionada, vencimento: estado.vencimentoSelecionado, notas: notas });
      });
      if (window.Sync && window.authEstado && window.authEstado.usuario) {
         var ted = estado.tarefas.filter(function(t) { return t.id === eid; })[0];
         if (ted) window.Sync.sincronizarTarefa(ted);
      }
      mostrarToast('Tarefa atualizada');
      anunciar('"' + titulo + '" atualizada.');
   } else {
      var nova = { id: Date.now(), titulo: titulo, prioridade: estado.prioridadeSelecionada, vencimento: estado.vencimentoSelecionado, notas: notas, concluida: false, criadaEm: new Date().toISOString().slice(0, 10) };
      estado.tarefas.unshift(nova);
      estado.idTarefaRecemCriada = nova.id;
      if (window.Sync && window.authEstado && window.authEstado.usuario) window.Sync.sincronizarTarefa(nova);
      mostrarToast('Tarefa criada');
      anunciar('"' + titulo + '" criada.');
   }
   salvarTarefasLocal();
   sincronizarEstado();
   fecharModal();
}

function alternarConclusao(id) {
   var tarefa = estado.tarefas.filter(function(t) { return t.id === id; })[0];
   if (!tarefa) return;
   estado.tarefas = estado.tarefas.map(function(t) {
      return t.id === id ? Object.assign({}, t, { concluida: !t.concluida }) : t;
   });
   var atualizada = estado.tarefas.filter(function(t) { return t.id === id; })[0];
   if (window.Sync && window.authEstado && window.authEstado.usuario) window.Sync.sincronizarTarefa(atualizada);
   var lista = elsDin.listaTarefas;
   var btnCheck = lista ? lista.querySelector('button[data-action="concluir"][data-id="' + id + '"]') : null;
   if (btnCheck) {
      btnCheck.classList.add('task-card__check--animando');
      setTimeout(function() { sincronizarEstado(); }, 80);
   } else {
      sincronizarEstado();
   }
   anunciar(!tarefa.concluida ? '"' + tarefa.titulo + '" concluída.' : '"' + tarefa.titulo + '" desmarcada.');
   salvarTarefasLocal();
}

function deletarTarefa(id) {
   var idx = estado.tarefas.findIndex(function(t) { return t.id === id; });
   if (idx === -1) return;
   var tarefa = estado.tarefas[idx];
   clearTimeout(undoTimeout);
   tarefaParaUndo     = { tarefa: tarefa, indice: idx };
   estado.tarefas     = estado.tarefas.filter(function(t) { return t.id !== id; });
   estado.deletandoId = null;
   if (estado.cardFocadoId === id) {
      var ids = obterIdsVisiveis().filter(function(i) { return i !== id; });
      estado.cardFocadoId = ids[Math.max(0, idx - 1)] || null;
   }
   if (window.Sync && window.authEstado && window.authEstado.usuario) window.Sync.deletarDoServidor(id);
   salvarTarefasLocal();
   sincronizarEstado({ somenteHeader: true });

   var lista = elsDin.listaTarefas;
   var card  = lista ? lista.querySelector('[data-id="' + id + '"]') : null;
   if (card) {
      card.classList.add('task-card--saindo');
      card.addEventListener('animationend', function() { renderizarTarefas(); }, { once: true });
   } else {
      renderizarTarefas();
   }

   mostrarToast('"' + tarefa.titulo + '" removida', 'info', { label: 'Desfazer', callback: desfazerDelecao });
   anunciar('"' + tarefa.titulo + '" deletada.');
   undoTimeout = setTimeout(function() { tarefaParaUndo = null; }, 5000);
}

function desfazerDelecao() {
   if (!tarefaParaUndo) return;
   var tarefa = tarefaParaUndo.tarefa;
   var indice = tarefaParaUndo.indice;
   estado.tarefas.splice(Math.min(indice, estado.tarefas.length), 0, tarefa);
   estado.idTarefaRecemCriada = tarefa.id;
   tarefaParaUndo = null;
   clearTimeout(undoTimeout);
   if (window.Sync && window.authEstado && window.authEstado.usuario) window.Sync.sincronizarTarefa(tarefa);
   salvarTarefasLocal();
   sincronizarEstado();
   mostrarToast('Tarefa restaurada', 'sucesso');
   anunciar('"' + tarefa.titulo + '" restaurada.');
}

// =============================================
// SELEÇÃO MÚLTIPLA
// =============================================
function obterIdsVisiveis() {
   var lista = elsDin.listaTarefas;
   if (!lista) return [];
   return Array.from(lista.querySelectorAll('.task-card[data-id]')).map(function(c) { return Number(c.dataset.id); });
}

function entrarModoSelecao(id) {
   estado.modoSelecao = true;
   estado.selecao     = new Set([id]);
   var lista = elsDin.listaTarefas;
   if (lista) lista.classList.add('lista--modo-selecao');
   var card = lista ? lista.querySelector('[data-id="' + id + '"]') : null;
   if (card) {
      card.classList.add('task-card--selecionado');
      var sb = card.querySelector('.task-card__sel');
      if (sb) { sb.innerHTML = SVG_CHKSEL; sb.setAttribute('aria-pressed', 'true'); }
   }
   var al = elsEstaticos.acaoLote;
   if (al) { al.classList.add('visivel'); al.setAttribute('aria-hidden', 'false'); }
   atualizarBarraLote();
}

function sairModoSelecao() {
   estado.modoSelecao = false;
   estado.selecao     = new Set();
   var lista = elsDin.listaTarefas;
   if (lista) {
      lista.classList.remove('lista--modo-selecao');
      lista.querySelectorAll('.task-card--selecionado').forEach(function(card) {
         card.classList.remove('task-card--selecionado');
         var sb = card.querySelector('.task-card__sel');
         if (sb) { sb.innerHTML = ''; sb.setAttribute('aria-pressed', 'false'); }
      });
   }
   var al = elsEstaticos.acaoLote;
   if (al) { al.classList.remove('visivel'); al.setAttribute('aria-hidden', 'true'); }
}

function toggleSelecaoCard(id) {
   if (estado.selecao.has(id)) estado.selecao.delete(id); else estado.selecao.add(id);
   var lista = elsDin.listaTarefas;
   var card  = lista ? lista.querySelector('[data-id="' + id + '"]') : null;
   if (card) {
      var agora = estado.selecao.has(id);
      card.classList.toggle('task-card--selecionado', agora);
      var sb = card.querySelector('.task-card__sel');
      if (sb) { sb.innerHTML = agora ? SVG_CHKSEL : ''; sb.setAttribute('aria-pressed', String(agora)); }
   }
   if (estado.selecao.size === 0) { sairModoSelecao(); return; }
   atualizarBarraLote();
}

function selecionarTodas() {
   obterTarefasFiltradas().forEach(function(t) { estado.selecao.add(t.id); });
   renderizarTarefas();
   atualizarBarraLote();
}

function atualizarBarraLote() {
   var ac = elsEstaticos.acaoLoteCount;
   if (!ac) return;
   var n = estado.selecao.size;
   ac.textContent = n + ' ' + (n === 1 ? 'tarefa selecionada' : 'tarefas selecionadas');
}

function concluirSelecionadas() {
   var ids = Array.from(estado.selecao);
   estado.tarefas = estado.tarefas.map(function(t) { return ids.indexOf(t.id) >= 0 ? Object.assign({}, t, { concluida: true }) : t; });
   salvarTarefas();
   sairModoSelecao();
   sincronizarEstado();
   mostrarToast(ids.length + ' ' + (ids.length === 1 ? 'tarefa concluída' : 'tarefas concluídas'));
}

function deletarSelecionadas() {
   var ids = Array.from(estado.selecao);
   ids.forEach(function(id) {
      if (window.Sync && window.authEstado && window.authEstado.usuario) window.Sync.deletarDoServidor(id);
   });
   estado.tarefas = estado.tarefas.filter(function(t) { return ids.indexOf(t.id) < 0; });
   salvarTarefasLocal();
   sairModoSelecao();
   sincronizarEstado();
   mostrarToast(ids.length + ' ' + (ids.length === 1 ? 'tarefa removida' : 'tarefas removidas'), 'info');
}

// =============================================
// DRAG AND DROP
// =============================================
function limparDrag() {
   document.querySelectorAll('.task-card--drag-over-top, .task-card--drag-over-bottom').forEach(function(el) {
      el.classList.remove('task-card--drag-over-top', 'task-card--drag-over-bottom');
   });
   document.querySelectorAll('.task-card--arrastando').forEach(function(el) { el.classList.remove('task-card--arrastando'); });
   estado.arrastandoId = null; estado.sobreId = null; estado.sobrePosicao = null;
}

function vincularDrag() {
   var lista = elsDin.listaTarefas;
   if (!lista) return;

   lista.addEventListener('dragstart', function(e) {
      var card = e.target.closest('.task-card[draggable="true"]');
      if (!card) return;
      estado.arrastandoId = Number(card.dataset.id);
      card.classList.add('task-card--arrastando');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.id);
   });

   lista.addEventListener('dragover', function(e) {
      e.preventDefault();
      var card = e.target.closest('.task-card[draggable="true"]');
      if (!card) return;
      var id = Number(card.dataset.id);
      if (id === estado.arrastandoId) return;
      var rect = card.getBoundingClientRect();
      var pos  = e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom';
      if (estado.sobreId === id && estado.sobrePosicao === pos) return;
      lista.querySelectorAll('.task-card--drag-over-top, .task-card--drag-over-bottom').forEach(function(el) {
         el.classList.remove('task-card--drag-over-top', 'task-card--drag-over-bottom');
      });
      card.classList.add('task-card--drag-over-' + pos);
      estado.sobreId = id; estado.sobrePosicao = pos;
   });

   lista.addEventListener('dragleave', function(e) {
      if (!lista.contains(e.relatedTarget)) limparDrag();
   });

   lista.addEventListener('drop', function(e) {
      e.preventDefault();
      if (!estado.arrastandoId || !estado.sobreId || estado.arrastandoId === estado.sobreId) { limparDrag(); return; }
      var novas   = estado.tarefas.slice();
      var srcIdx  = novas.findIndex(function(t) { return t.id === estado.arrastandoId; });
      var removida= novas.splice(srcIdx, 1)[0];
      var novoIdx = novas.findIndex(function(t) { return t.id === estado.sobreId; });
      novas.splice(estado.sobrePosicao === 'top' ? novoIdx : novoIdx + 1, 0, removida);
      estado.tarefas = novas;
      anunciar('"' + removida.titulo + '" reorganizada.');
      salvarTarefas();
      limparDrag();
      sincronizarEstado();
   });

   lista.addEventListener('dragend', limparDrag);
}

// =============================================
// NAVEGAÇÃO POR TECLADO
// =============================================
function navegarCards(direcao) {
   var ids     = obterIdsVisiveis();
   if (!ids.length) return;
   var idxAtual = ids.indexOf(estado.cardFocadoId);
   var novoIdx;
   if (idxAtual === -1) novoIdx = direcao === 'baixo' ? 0 : ids.length - 1;
   else novoIdx = direcao === 'baixo' ? Math.min(idxAtual + 1, ids.length - 1) : Math.max(idxAtual - 1, 0);
   estado.cardFocadoId = ids[novoIdx];
   var lista = elsDin.listaTarefas;
   var card  = lista ? lista.querySelector('[data-id="' + estado.cardFocadoId + '"]') : null;
   if (card) {
      var titulo = card.querySelector('.task-card__title--btn');
      if (titulo) titulo.focus();
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
   }
}

// =============================================
// CONTADOR DE CARACTERES
// =============================================
var LIMITE_TITULO = 120;
var LIMITE_AVISO  = 30;

function atualizarContador() {
   var it = elsEstaticos.inputTitulo;
   var cc = elsEstaticos.charCounter;
   if (!it || !cc) return;
   var rest = LIMITE_TITULO - it.value.length;
   if (rest <= LIMITE_AVISO) {
      cc.textContent = String(rest);
      cc.classList.add('visivel');
      cc.classList.toggle('char-counter--urgente', rest <= 10);
   } else {
      cc.classList.remove('visivel', 'char-counter--urgente');
   }
}

// =============================================
// NOTIFICAÇÕES WEB
// =============================================
var NOTIF_KEY = 'vf-notif-ultima';

function verificarNotificacoes() {
   if (!('Notification' in window)) return;
   if (Notification.permission === 'denied') return;
   var hoje        = new Date().toISOString().slice(0, 10);
   var ultimaNotif = localStorage.getItem(NOTIF_KEY);
   if (ultimaNotif === hoje) return;
   var vendemHoje = estado.tarefas.filter(function(t) { return !t.concluida && t.vencimento === hoje; });
   if (!vendemHoje.length) return;
   if (Notification.permission === 'granted') {
      enviarNotificacoes(vendemHoje, hoje);
   } else {
      var np = elsEstaticos.notifPrompt;
      var nt = elsEstaticos.notifPromptTexto;
      if (!np || !nt) return;
      nt.textContent = vendemHoje.length === 1 ? 'Você tem 1 tarefa vencendo hoje.' : 'Você tem ' + vendemHoje.length + ' tarefas vencendo hoje.';
      np.style.display = 'flex';
   }
}

function enviarNotificacoes(tarefas, hoje) {
   tarefas.forEach(function(t, i) {
      setTimeout(function() { new Notification('Vamos Fazer? — Vencimento hoje', { body: t.titulo, icon: './icon.svg', tag: 'vf-' + t.id }); }, i * 800);
   });
   localStorage.setItem(NOTIF_KEY, hoje);
}

function ativarNotificacoes() {
   if (!('Notification' in window)) { mostrarToast('Notificações não suportadas neste browser.', 'erro'); return; }
   Notification.requestPermission().then(function(perm) {
      if (perm === 'granted') {
         var hoje = new Date().toISOString().slice(0, 10);
         var vendemHoje = estado.tarefas.filter(function(t) { return !t.concluida && t.vencimento === hoje; });
         if (vendemHoje.length) enviarNotificacoes(vendemHoje, hoje);
         var np = elsEstaticos.notifPrompt;
         if (np) np.style.display = 'none';
         mostrarToast('Alertas de vencimento ativados.', 'sucesso');
      } else if (perm === 'denied') {
         mostrarToast('Permissão negada. Ative nas configurações do browser.', 'info');
         var np2 = elsEstaticos.notifPrompt;
         if (np2) np2.style.display = 'none';
      }
   });
}

// =============================================
// EXPORT / IMPORT
// =============================================
function downloadArquivo(conteudo, nome, tipo) {
   var blob = new Blob([conteudo], { type: tipo });
   var url  = URL.createObjectURL(blob);
   var link = document.createElement('a');
   link.href = url; link.download = nome;
   document.body.appendChild(link); link.click(); document.body.removeChild(link);
   requestAnimationFrame(function() { URL.revokeObjectURL(url); });
}

function exportarJSON() {
   var dados = { versao: '1.0', exportado: new Date().toISOString(), tarefas: estado.tarefas };
   downloadArquivo(JSON.stringify(dados, null, 2), 'vamos-fazer-' + new Date().toISOString().slice(0,10) + '.json', 'application/json');
   mostrarToast('Backup JSON exportado', 'sucesso');
   fecharExportMenu();
}

function exportarCSV() {
   var BOM  = '\uFEFF';
   var cab  = ['ID', 'Título', 'Prioridade', 'Vencimento', 'Notas', 'Concluída', 'Criada em'];
   var lins = estado.tarefas.map(function(t) {
      return [t.id, '"' + String(t.titulo).replace(/"/g, '""') + '"', t.prioridade, t.vencimento || '', '"' + String(t.notas || '').replace(/"/g, '""') + '"', t.concluida ? 'sim' : 'não', t.criadaEm];
   });
   var csv = BOM + [cab].concat(lins).map(function(l) { return l.join(','); }).join('\n');
   downloadArquivo(csv, 'vamos-fazer-' + new Date().toISOString().slice(0,10) + '.csv', 'text/csv;charset=utf-8');
   mostrarToast('CSV exportado', 'sucesso');
   fecharExportMenu();
}

function abrirExportMenu() {
   var em = elsEstaticos.exportMenu;
   var be = elsEstaticos.btnExportar;
   if (!em) return;
   var aberto = em.classList.toggle('visivel');
   if (be) be.setAttribute('aria-expanded', String(aberto));
}

function fecharExportMenu() {
   var em = elsEstaticos.exportMenu;
   var be = elsEstaticos.btnExportar;
   if (em) em.classList.remove('visivel');
   if (be) be.setAttribute('aria-expanded', 'false');
}

function abrirImportador() {
   fecharExportMenu();
   dadosParaImportar = null;
   var ip = elsEstaticos.importPreview;
   var io = elsEstaticos.importOpcoes;
   var bc = elsEstaticos.btnConfirmarImportar;
   var mi = elsEstaticos.modalImportar;
   var ii = elsEstaticos.inputImportar;
   if (ip) { ip.textContent = 'Selecione um arquivo .json exportado pelo app.'; ip.className = 'import-preview'; }
   if (io) { io.setAttribute('aria-hidden', 'true'); io.style.display = 'none'; }
   if (bc) bc.disabled = true;
   if (mi) { mi.classList.add('is-open'); mi.setAttribute('aria-hidden', 'false'); }
   setTimeout(function() { if (ii) ii.click(); }, 100);
}

function fecharModalImportar() {
   var mi = elsEstaticos.modalImportar;
   if (mi) { mi.classList.remove('is-open'); mi.setAttribute('aria-hidden', 'true'); }
   dadosParaImportar = null;
}

function confirmarImportacao() {
   if (!dadosParaImportar) return;
   var modoEl = document.querySelector('input[name="import-modo"]:checked');
   var modo   = modoEl ? modoEl.value : 'merge';
   var n      = dadosParaImportar.tarefas.length;
   if (modo === 'substituir') {
      estado.tarefas = dadosParaImportar.tarefas;
   } else {
      var idsExist = new Set(estado.tarefas.map(function(t) { return t.id; }));
      var novas    = dadosParaImportar.tarefas.filter(function(t) { return !idsExist.has(t.id); });
      estado.tarefas = novas.concat(estado.tarefas);
   }
   salvarTarefas();
   sincronizarEstado();
   fecharModalImportar();
   mostrarToast(n + ' ' + (modo === 'substituir' ? 'tarefas importadas' : 'tarefas adicionadas'), 'sucesso');
   dadosParaImportar = null;
}

// =============================================
// SHORTCUTS OVERLAY
// =============================================
function abrirShortcuts() {
   var so = elsEstaticos.shortcutsOverlay;
   var bf = elsEstaticos.btnFecharShortcuts;
   if (so) { so.classList.add('is-open'); so.setAttribute('aria-hidden', 'false'); }
   if (bf) bf.focus();
}

function fecharShortcuts() {
   var so = elsEstaticos.shortcutsOverlay;
   var ba = elsEstaticos.btnAtalhos;
   if (so) { so.classList.remove('is-open'); so.setAttribute('aria-hidden', 'true'); }
   if (ba) ba.focus();
}

// =============================================
// FOCUS TRAP
// =============================================
function getFocusaveis(container) {
   return Array.from(container.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
}

function aplicarFocusTrap(e, container) {
   var focs  = getFocusaveis(container);
   if (!focs.length) return;
   var pri   = focs[0];
   var ult   = focs[focs.length - 1];
   if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); }
   else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
}

// =============================================
// SEARCH
// =============================================
function toggleSearchClear() {
   var si = elsDin.searchInput;
   var sc = elsDin.searchClear;
   if (!si || !sc) return;
   var tem = !!si.value;
   sc.classList.toggle('visivel', tem);
   sc.setAttribute('tabindex', tem ? '0' : '-1');
}

// =============================================
// CALENDÁRIO EDITORIAL
// =============================================
var MESES_PT    = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
var DIAS_SEM_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

var calMes = new Date().getMonth();
var calAno = new Date().getFullYear();

function renderizarCalendario() {
   var main = el('main-content');
   if (!main) return;

   var hoje       = new Date().toISOString().slice(0, 10);
   var diasNoMes  = new Date(calAno, calMes + 1, 0).getDate();
   var primeiroDia = new Date(calAno, calMes, 1).getDay();

   var agora      = new Date();
   var ehAtual    = calAno === agora.getFullYear() && calMes === agora.getMonth();
   var ehFuturo   = calAno > agora.getFullYear() || (calAno === agora.getFullYear() && calMes > agora.getMonth());
   var btnHoje    = '<button class="calendario-nav__hoje" id="cal-hoje">Hoje</button>';

   var navHtml =
      '<div class="calendario-nav" aria-label="Navegação do calendário">' +
         '<div class="calendario-nav__lado">' +
            '<button class="calendario-nav__btn" id="cal-anterior" aria-label="Mês anterior">' +
               '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</button>' +
            (!ehAtual && ehFuturo ? btnHoje : '') +
         '</div>' +
         '<div class="calendario-nav__centro">' +
            '<span class="calendario-nav__mes-nome">' + MESES_PT[calMes] + '</span>' +
            '<span class="calendario-nav__ano-num">' + calAno + '</span>' +
         '</div>' +
         '<div class="calendario-nav__lado">' +
            (!ehAtual && !ehFuturo ? btnHoje : '') +
            '<button class="calendario-nav__btn" id="cal-proximo" aria-label="Próximo mês">' +
               '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5 2l5 5-5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</button>' +
         '</div>' +
      '</div>';

   var cabecalho = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(function(d) {
      return '<span class="calendario-grade__dia-sem">' + d + '</span>';
   }).join('');

   var celulas = '';
   for (var i = 0; i < primeiroDia; i++) {
      celulas += '<div class="calendario-celula calendario-celula--vazia"></div>';
   }
   for (var d = 1; d <= diasNoMes; d++) {
      var dStr   = calAno + '-' + String(calMes + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var diaSem = new Date(dStr + 'T00:00:00').getDay();
      var ehHoje = dStr === hoje;
      var ehFds  = diaSem === 0 || diaSem === 6;
      var tDia   = estado.tarefas.filter(function(t) { return t.vencimento === dStr; });
      var MAX    = 3;
      var pontos = tDia.slice(0, MAX).map(function(t) {
         return '<span class="calendario-celula__ponto calendario-celula__ponto--' + t.prioridade + (t.concluida ? ' calendario-celula__ponto--feita' : '') + '" data-cal-id="' + t.id + '" role="button" tabindex="0" aria-label="' + escaparHtml(t.titulo) + '" title="' + escaparHtml(t.titulo) + '"></span>';
      }).join('');
      var mais = tDia.length > MAX ? '<span class="calendario-celula__mais">+' + (tDia.length - MAX) + '</span>' : '';
      celulas +=
         '<div class="calendario-celula' +
            (ehHoje ? ' calendario-celula--hoje' : '') +
            (ehFds  ? ' calendario-celula--fds'  : '') +
            '" data-cal-data="' + dStr + '" aria-label="' + d + ' de ' + MESES_PT[calMes] + '">' +
            '<span class="calendario-celula__num">' + d + '</span>' +
            '<div class="calendario-celula__tarefas">' + pontos + mais + '</div>' +
            '<div class="calendario-celula__add" aria-hidden="true">+</div>' +
         '</div>';
   }

   main.innerHTML =
      '<div class="calendario-wrapper">' +
         navHtml +
         '<div class="calendario-grade">' +
            '<div class="calendario-grade__cabecalho">' + cabecalho + '</div>' +
            '<div class="calendario-grade__dias">' + celulas + '</div>' +
         '</div>' +
      '</div>';

   // Navegação
   var btnAnt  = el('cal-anterior');
   var btnPro  = el('cal-proximo');
   var btnHoje = el('cal-hoje');

   if (btnAnt) btnAnt.addEventListener('click', function() {
      calMes--; if (calMes < 0) { calMes = 11; calAno--; } renderizarCalendario();
   });
   if (btnPro) btnPro.addEventListener('click', function() {
      calMes++; if (calMes > 11) { calMes = 0; calAno++; } renderizarCalendario();
   });
   if (btnHoje) btnHoje.addEventListener('click', function() {
      calMes = new Date().getMonth(); calAno = new Date().getFullYear(); renderizarCalendario();
   });

   // Clique em ponto: abre edição
   main.querySelectorAll('.calendario-celula__ponto[data-cal-id]').forEach(function(ponto) {
      ponto.addEventListener('click', function(e) {
         e.stopPropagation();
         var id = Number(ponto.dataset.calId);
         trocarParaLista(function() { setTimeout(function() { abrirEdicao(id); }, 150); });
      });
      ponto.addEventListener('keydown', function(e) {
         if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ponto.click(); }
      });
   });

   // Clique na célula: cria tarefa para aquela data
   main.querySelectorAll('.calendario-celula:not(.calendario-celula--vazia)').forEach(function(cel) {
      cel.addEventListener('click', function(e) {
         if (e.target.closest('.calendario-celula__ponto')) return;
         var data = cel.dataset.calData;
         if (!data) return;
         abrirModal();
         atualizarVencimentoModal(data);
      });
   });
}

// =============================================
// TROCAR ENTRE VIEWS
// =============================================
function trocarParaLista(callback) {
   estado.viewAtual = 'lista';
   var main = el('main-content');
   if (!main) { if (callback) callback(); return; }

   main.innerHTML = htmlListaView();
   resolverElsDinamicos();
   vincularEventosDinamicos();
   sincronizarEstado();

   // Atualiza nav ativo
   elsEstaticos.navItems = document.querySelectorAll('.sidebar__nav-item');
   elsEstaticos.navItems.forEach(function(item) {
      var isAtivo = item.dataset.filtro === estado.filtroAtivo;
      item.classList.toggle('sidebar__nav-item--active', isAtivo);
      if (isAtivo) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
   });

   if (callback) callback();
}

function trocarParaCalendario() {
   estado.viewAtual = 'calendario';
   renderizarCalendario();
}

function htmlListaView() {
   return '' +
      '<button class="menu-toggle" id="menu-toggle" aria-label="Abrir menu lateral" aria-expanded="false" aria-controls="sidebar">' +
         '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>' +
      '</button>' +
      '<header class="main__header">' +
         '<div class="main__header-left">' +
            '<h1 class="main__title" id="main-title">Todas as Tarefas</h1>' +
            '<p class="main__subtitle" id="main-subtitle">Nenhuma tarefa pendente</p>' +
         '</div>' +
         '<div class="main__header-right">' +
            '<button class="btn btn--primary" id="btn-nova-tarefa" aria-label="Criar nova tarefa — atalho: N">' +
               '<svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
               ' Nova Tarefa' +
            '</button>' +
         '</div>' +
      '</header>' +
      '<div class="stats-bar" id="stats-bar" aria-label="Resumo" role="status" aria-live="polite"></div>' +
      '<div id="notif-prompt" class="notif-prompt" style="display:none" role="status">' +
         '<span class="notif-prompt__icone" aria-hidden="true">🔔</span>' +
         '<span class="notif-prompt__texto" id="notif-prompt-texto">Você tem tarefas vencendo hoje.</span>' +
         '<button class="notif-prompt__btn" id="btn-ativar-notif">Ativar alertas</button>' +
         '<button class="notif-prompt__fechar" id="btn-fechar-notif" aria-label="Fechar aviso">✕</button>' +
      '</div>' +
      '<div class="search-wrapper" id="search-wrapper">' +
         '<span class="search-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.4"/><path d="M9.5 9.5L12.5 12.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span>' +
         '<input type="search" class="search-input" id="search-input" placeholder="Buscar tarefas..." autocomplete="nope" aria-label="Buscar tarefas" />' +
         '<button class="search-clear" id="search-clear" aria-label="Limpar busca" tabindex="-1"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>' +
      '</div>' +
      '<div class="progresso-wrapper">' +
         '<div class="progresso-container" id="progresso-container" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Progresso das tarefas"><div class="progresso-bar" id="progresso-bar"></div></div>' +
         '<span class="progresso-pct" id="progresso-pct"></span>' +
      '</div>' +
      '<section class="tasks" id="lista-tarefas" role="list" aria-label="Lista de tarefas"></section>';
}

// =============================================
// EVENTOS DINÂMICOS (re-vinculados ao trocar view)
// =============================================
function vincularEventosDinamicos() {
   resolverElsDinamicos();

   // Atualiza refs de notif (ficam dentro da lista view)
   elsEstaticos.notifPrompt     = el('notif-prompt');
   elsEstaticos.notifPromptTexto= el('notif-prompt-texto');
   elsEstaticos.btnAtivarNotif  = el('btn-ativar-notif');
   elsEstaticos.btnFecharNotif  = el('btn-fechar-notif');

   var btnNova = elsDin.btnNovaTarefa;
   if (btnNova) btnNova.addEventListener('click', abrirModal);

   var si = elsDin.searchInput;
   if (si) {
      si.addEventListener('input', function() {
         clearTimeout(buscaTimeout);
         buscaTimeout = setTimeout(function() {
            estado.buscaAtiva = si.value.trim();
            toggleSearchClear();
            sincronizarEstado();
         }, 180);
      });
   }

   var sc = elsDin.searchClear;
   if (sc) {
      sc.addEventListener('click', function() {
         var si2 = elsDin.searchInput;
         if (si2) si2.value = '';
         estado.buscaAtiva = '';
         toggleSearchClear();
         sincronizarEstado();
         if (si2) si2.focus();
      });
   }

   var mt = el('menu-toggle');
   if (mt) {
      elsEstaticos.menuToggle = mt;
      mt.addEventListener('click', function(e) {
         e.stopPropagation();
         var sb   = elsEstaticos.sidebar;
         if (!sb) return;
         var open = sb.classList.toggle('is-open');
         mt.setAttribute('aria-expanded', String(open));
      });
   }

   var lista = elsDin.listaTarefas;
   if (lista) {
      vincularDrag();
      vincularEventosLista(lista);
   }

   var btn_aN = elsEstaticos.btnAtivarNotif;
   if (btn_aN) btn_aN.addEventListener('click', ativarNotificacoes);
   var btn_fN = elsEstaticos.btnFecharNotif;
   if (btn_fN) btn_fN.addEventListener('click', function() {
      var np = elsEstaticos.notifPrompt;
      if (np) np.style.display = 'none';
   });
}

function vincularEventosLista(lista) {
   // Delegação de eventos para cards
   lista.addEventListener('click', function(e) {
      var sortBtn = e.target.closest('button[data-sort]');
      if (sortBtn) {
         var nova = sortBtn.dataset.sort;
         if (nova !== estado.ordenacao) { estado.ordenacao = nova; sincronizarEstado(); }
         return;
      }
      var btn  = e.target.closest('button[data-action]');
      if (!btn) return;
      var id   = Number(btn.dataset.id);
      var acao = btn.dataset.action;
      estado.cardFocadoId = id;
      if (acao === 'selecionar') { if (!estado.modoSelecao) entrarModoSelecao(id); else toggleSelecaoCard(id); return; }
      if (estado.modoSelecao && acao === 'editar') { toggleSelecaoCard(id); return; }
      if (acao === 'concluir') { alternarConclusao(id); return; }
      if (acao === 'editar')   { abrirEdicao(id); return; }
      if (acao === 'deletar') {
         if (estado.deletandoId === id) { deletarTarefa(id); }
         else {
            if (estado.deletandoId !== null) {
               var ant = lista.querySelector('button[data-action="deletar"][data-id="' + estado.deletandoId + '"]');
               if (ant) { ant.innerHTML = SVG_DEL; ant.classList.remove('task-card__delete--confirmar'); }
            }
            estado.deletandoId = id;
            btn.textContent    = 'Deletar?';
            btn.classList.add('task-card__delete--confirmar');
         }
      }
   });

   lista.addEventListener('focusin', function(e) {
      var card = e.target.closest('.task-card[data-id]');
      if (card) estado.cardFocadoId = Number(card.dataset.id);
   });

   // Ctrl+Click
   lista.addEventListener('click', function(e) {
      if (!e.ctrlKey && !e.metaKey) return;
      var card = e.target.closest('.task-card');
      if (!card) return;
      e.preventDefault();
      var id = Number(card.dataset.id);
      if (!estado.modoSelecao) entrarModoSelecao(id); else toggleSelecaoCard(id);
   });

   // Long press
   lista.addEventListener('touchstart', function(e) {
      var card = e.target.closest('.task-card');
      if (!card) return;
      longPressCardId = Number(card.dataset.id);
      longPressTimer  = setTimeout(function() {
         if (navigator.vibrate) navigator.vibrate(12);
         if (!estado.modoSelecao) entrarModoSelecao(longPressCardId); else toggleSelecaoCard(longPressCardId);
         longPressCardId = null;
      }, 300);
   }, { passive: true });

   lista.addEventListener('touchend',  function() { clearTimeout(longPressTimer); longPressTimer = null; longPressCardId = null; });
   lista.addEventListener('touchmove', function() { clearTimeout(longPressTimer); longPressTimer = null; longPressCardId = null; }, { passive: true });
}

// =============================================
// INICIALIZA PRINT DATE
// =============================================
function inicializarPrintDate() {
   var main = el('main-content');
   if (!main) return;
   main.setAttribute('data-print-date', new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
}

// =============================================
// PWA INSTALL
// =============================================
window.addEventListener('beforeinstallprompt', function(e) {
   e.preventDefault();
   installPromptEvent = e;
   var btn = el('btn-instalar-pwa') || elsEstaticos.btnInstalarPwa;
   if (btn) btn.classList.add('visivel');
});

window.addEventListener('appinstalled', function() {
   installPromptEvent = null;
   var btn = el('btn-instalar-pwa') || elsEstaticos.btnInstalarPwa;
   if (btn) btn.classList.remove('visivel');
   mostrarToast('App instalado com sucesso!', 'sucesso');
});

// =============================================
// SERVICE WORKER
// =============================================
if ('serviceWorker' in navigator) {
   window.addEventListener('load', function() {
      navigator.serviceWorker.register('./sw.js')
         .then(function(reg) { console.log('SW registrado:', reg.scope); })
         .catch(function(err) { console.warn('SW não registrado:', err); });
   });
}

// =============================================
// VINCULAR TODOS OS EVENTOS ESTÁTICOS
// =============================================
function vincularEventosEstaticos() {
   // Modal de tarefa
   var bfm = elsEstaticos.btnFecharModal;
   var bc2 = elsEstaticos.btnCancelar;
   var bct = elsEstaticos.btnCriarTarefa;
   var mo  = elsEstaticos.modalOverlay;
   var it  = elsEstaticos.inputTitulo;
   var nt  = elsEstaticos.inputNotas;
   var iv  = elsEstaticos.inputVencimento;
   var blv = elsEstaticos.btnLimparVencimento;

   if (bfm) bfm.addEventListener('click', fecharModal);
   if (bc2) bc2.addEventListener('click', fecharModal);
   if (bct) bct.addEventListener('click', criarTarefa);
   if (mo)  mo.addEventListener('click', function(e) { if (e.target === mo) fecharModal(); });

   if (it) {
      it.addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) criarTarefa(); });
      it.addEventListener('input', function() { it.classList.remove('modal__input--erro'); atualizarContador(); });
   }

   if (nt) {
      nt.addEventListener('keydown', function(e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) criarTarefa(); autoResizeTextarea(nt); });
      nt.addEventListener('input', function() { autoResizeTextarea(nt); });
   }

   if (iv) iv.addEventListener('input', function() { atualizarVencimentoModal(iv.value || null); });
   if (blv) blv.addEventListener('click', function() { atualizarVencimentoModal(null); });

   var vps = elsEstaticos.vencimentoPresets;
   if (vps) vps.forEach(function(btn) {
      btn.addEventListener('click', function() {
         var dias   = Number(btn.dataset.dias);
         var jaAtivo= btn.classList.contains('vencimento-preset--ativo');
         atualizarVencimentoModal(jaAtivo ? null : calcularData(dias));
      });
   });

   var pbs = elsEstaticos.prioridadeBtns;
   if (pbs) pbs.forEach(function(btn) {
      btn.addEventListener('click', function() {
         pbs.forEach(function(b) { b.classList.remove('prioridade-btn--ativo'); b.setAttribute('aria-pressed', 'false'); });
         btn.classList.add('prioridade-btn--ativo'); btn.setAttribute('aria-pressed', 'true');
         estado.prioridadeSelecionada = btn.dataset.valor;
      });
   });

   // Nav items
   var navIs = elsEstaticos.navItems;
   if (navIs) navIs.forEach(function(item) {
      var ativar = function() {
         navIs.forEach(function(i) { i.classList.remove('sidebar__nav-item--active'); i.removeAttribute('aria-current'); });
         item.classList.add('sidebar__nav-item--active');
         item.setAttribute('aria-current', 'page');
         var filtro = item.dataset.filtro;
         if (filtro === 'calendario') {
            estado.filtroAtivo = 'calendario';
            trocarParaCalendario();
         } else {
            estado.filtroAtivo  = filtro;
            estado.cardFocadoId = null;
            if (estado.viewAtual !== 'lista') {
               trocarParaLista();
            } else {
               sincronizarEstado({ stagger: true });
            }
         }
         if (window.innerWidth <= 640) {
            var sb = elsEstaticos.sidebar;
            var mt = elsEstaticos.menuToggle;
            if (sb) sb.classList.remove('is-open');
            if (mt) mt.setAttribute('aria-expanded', 'false');
         }
      };
      item.addEventListener('click', ativar);
      item.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ativar(); } });
   });

   // Ações em lote
   var blc  = elsEstaticos.btnLoteCancelar;
   var bls  = elsEstaticos.btnLoteSelecionarTodas;
   var blco = elsEstaticos.btnLoteConcluir;
   var bld  = elsEstaticos.btnLoteDeletar;
   if (blc)  blc.addEventListener('click', sairModoSelecao);
   if (bls)  bls.addEventListener('click', selecionarTodas);
   if (blco) blco.addEventListener('click', concluirSelecionadas);
   if (bld)  bld.addEventListener('click', deletarSelecionadas);

   // Sidebar user (logout)
   var su = elsEstaticos.sidebarUser;
   if (su) su.addEventListener('click', abrirModalPerfil);

   var bfp = elsEstaticos.btnFecharPerfil;
   if (bfp) bfp.addEventListener('click', fecharModalPerfil);

   var bcp = elsEstaticos.btnCancelarPerfil;
   if (bcp) bcp.addEventListener('click', fecharModalPerfil);

   var bsp = elsEstaticos.btnSalvarPerfil;
   if (bsp) bsp.addEventListener('click', salvarPerfil);

   var bpl = elsEstaticos.btnPerfilLogout;
   if (bpl) bpl.addEventListener('click', function() {
      fecharModalPerfil();
      if (window.Auth) { mostrarToast('Saindo...', 'info'); window.Auth.logout(); }
   });

   var mp = elsEstaticos.modalPerfil;
   if (mp) mp.addEventListener('click', function(e) { if (e.target === mp) fecharModalPerfil(); });

   var mp2 = elsEstaticos.modalPerfil;
   if (mp2) mp2.addEventListener('click', function(e) {
      var btn = e.target.closest('.input-senha-olho');
      if (!btn) return;
      var inp = document.getElementById(btn.dataset.alvo);
      if (!inp) return;
      var visivel = inp.type === 'text';
      inp.type = visivel ? 'password' : 'text';
      btn.setAttribute('aria-label', visivel ? 'Mostrar senha' : 'Ocultar senha');
      btn.querySelector('.olho-aberto').style.display  = visivel ? '' : 'none';
      btn.querySelector('.olho-fechado').style.display = visivel ? 'none' : '';
   });

   var bts = elsEstaticos.btnToggleSenha;
   var psc = elsEstaticos.perfilSenhaCampos;
   if (bts && psc) {
      bts.addEventListener('click', function() {
         var aberto = psc.classList.toggle('perfil-senha-campos--aberto');
         bts.setAttribute('aria-expanded', String(aberto));
         psc.setAttribute('aria-hidden', String(!aberto));
         psc.querySelectorAll('input').forEach(function(inp) {
            inp.setAttribute('tabindex', aberto ? '0' : '-1');
         });
         if (aberto) {
            var primeiro = psc.querySelector('input');
            if (primeiro) setTimeout(function() { primeiro.focus(); }, 260);
         }
      });
   }

   var bta = elsEstaticos.btnTrocarAvatar;
   var ia  = elsEstaticos.inputAvatar;
   if (bta && ia) {
      bta.addEventListener('click', function() { ia.click(); });
      ia.addEventListener('change', function() {
         var arquivo = ia.files[0];
         if (!arquivo) return;
         var reader = new FileReader();
         reader.onload = function(e) {
            var av = elsEstaticos.perfilAvatarPreview;
            if (av) {
               av.innerHTML = '<img src="' + e.target.result + '" alt="Foto de perfil" />';
               av.dataset.novoAvatar = e.target.result;
            }
         };
         reader.readAsDataURL(arquivo);
      });
   }

   // Tema, atalhos, export
   var bt = elsEstaticos.btnTema;
   if (bt) bt.addEventListener('click', toggleTema);

   var ba = elsEstaticos.btnAtalhos;
   if (ba) ba.addEventListener('click', abrirShortcuts);

   var bfs = elsEstaticos.btnFecharShortcuts;
   if (bfs) bfs.addEventListener('click', fecharShortcuts);

   var so = elsEstaticos.shortcutsOverlay;
   if (so) so.addEventListener('click', function(e) { if (e.target === so) fecharShortcuts(); });

   var be = elsEstaticos.btnExportar;
   if (be) be.addEventListener('click', function(e) { e.stopPropagation(); abrirExportMenu(); });

   var bej = elsEstaticos.btnExportJson;
   if (bej) bej.addEventListener('click', exportarJSON);

   var bec = elsEstaticos.btnExportCsv;
   if (bec) bec.addEventListener('click', exportarCSV);

   var bim = elsEstaticos.btnImportar;
   if (bim) bim.addEventListener('click', abrirImportador);

   var bfi = elsEstaticos.btnFecharImportar;
   if (bfi) bfi.addEventListener('click', fecharModalImportar);

   var bci = elsEstaticos.btnCancelarImportar;
   if (bci) bci.addEventListener('click', fecharModalImportar);

   var bconf = elsEstaticos.btnConfirmarImportar;
   if (bconf) bconf.addEventListener('click', confirmarImportacao);

   var mim = elsEstaticos.modalImportar;
   if (mim) mim.addEventListener('click', function(e) { if (e.target === mim) fecharModalImportar(); });

   var bip = elsEstaticos.btnInstalarPwa;
   if (bip) bip.addEventListener('click', function() {
      if (installPromptEvent) { installPromptEvent.prompt(); installPromptEvent.userChoice.then(function() { installPromptEvent = null; }); }
   });

   // Import file input
   var ii = elsEstaticos.inputImportar;
   if (ii) {
      ii.addEventListener('change', function() {
         var arquivo = ii.files[0];
         if (!arquivo) return;
         var reader = new FileReader();
         reader.onload = function(e) {
            try {
               var json = JSON.parse(e.target.result);
               if (!json.tarefas || !Array.isArray(json.tarefas)) throw new Error('Campo "tarefas" não encontrado.');
               var n = json.tarefas.length;
               dadosParaImportar = json;
               var ip = elsEstaticos.importPreview;
               var io = elsEstaticos.importOpcoes;
               var bc = elsEstaticos.btnConfirmarImportar;
               if (ip) {
                  ip.innerHTML = '<strong style="font-size:15px;font-weight:500;color:var(--color-text)">' + n + ' ' + (n === 1 ? 'tarefa' : 'tarefas') + '</strong><br>' + (json.exportado ? 'Exportado em ' + new Date(json.exportado).toLocaleDateString('pt-BR') : 'Arquivo válido');
                  ip.className = 'import-preview import-preview--sucesso';
               }
               if (io) { io.setAttribute('aria-hidden', 'false'); io.style.display = 'flex'; }
               if (bc) bc.disabled = false;
            } catch(err) {
               var ip2 = elsEstaticos.importPreview;
               var io2 = elsEstaticos.importOpcoes;
               var bc2 = elsEstaticos.btnConfirmarImportar;
               if (ip2) { ip2.textContent = 'Arquivo inválido: ' + err.message; ip2.className = 'import-preview import-preview--erro'; }
               if (io2) { io2.setAttribute('aria-hidden', 'true'); io2.style.display = 'none'; }
               if (bc2) bc2.disabled = true;
               dadosParaImportar = null;
            }
         };
         reader.readAsText(arquivo);
      });
   }

   // Menu mobile
   document.addEventListener('click', function(e) {
      var sb = elsEstaticos.sidebar;
      var mt = elsEstaticos.menuToggle;
      if (sb && sb.classList.contains('is-open') && !sb.contains(e.target) && e.target !== mt) {
         sb.classList.remove('is-open');
         if (mt) mt.setAttribute('aria-expanded', 'false');
      }
   });

   // Fechar export menu ao clicar fora
   document.addEventListener('click', function(e) {
      var em = elsEstaticos.exportMenu;
      var be2 = elsEstaticos.btnExportar;
      if (em && !em.contains(e.target) && e.target !== be2) fecharExportMenu();
   });

   // Cancela confirm delete ao clicar fora
   document.addEventListener('click', function(e) {
      if (estado.deletandoId === null) return;
      if (e.target.closest && e.target.closest('button[data-action="deletar"]')) return;
      var lista = elsDin.listaTarefas;
      if (!lista) { estado.deletandoId = null; return; }
      var conf = lista.querySelector('button[data-action="deletar"][data-id="' + estado.deletandoId + '"]');
      if (conf) { conf.innerHTML = SVG_DEL; conf.classList.remove('task-card__delete--confirmar'); }
      estado.deletandoId = null;
   });

   // Teclado global
   document.addEventListener('keydown', function(e) {
      var moAberto = elsEstaticos.modalOverlay && elsEstaticos.modalOverlay.classList.contains('is-open');
      var miAberto = elsEstaticos.modalImportar && elsEstaticos.modalImportar.classList.contains('is-open');
      var soAberto = elsEstaticos.shortcutsOverlay && elsEstaticos.shortcutsOverlay.classList.contains('is-open');
      var qualquerModal = moAberto || miAberto || soAberto;
      var tag  = document.activeElement ? document.activeElement.tagName : '';
      var emInput = tag === 'INPUT' || tag === 'TEXTAREA';

      if (e.key === 'Escape') {
         if (soAberto) { fecharShortcuts(); return; }
         if (miAberto) { fecharModalImportar(); return; }
         if (moAberto) { fecharModal(); return; }
         if (estado.modoSelecao) { sairModoSelecao(); return; }
         var em = elsEstaticos.exportMenu;
         if (em && em.classList.contains('visivel')) { fecharExportMenu(); return; }
         if (estado.cardFocadoId !== null) { estado.cardFocadoId = null; return; }
      }

      if (!qualquerModal && !emInput) {
         if (e.key === '?') { e.preventDefault(); abrirShortcuts(); return; }
         if (e.key === 'n' || e.key === 'N') { if (!estado.modoSelecao) { e.preventDefault(); abrirModal(); return; } }
         if (e.key === '/') { e.preventDefault(); var si = elsDin.searchInput; if (si) { si.focus(); si.select(); } return; }
         if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            var lista = elsDin.listaTarefas;
            if (lista && (lista.contains(document.activeElement) || estado.cardFocadoId !== null)) {
               e.preventDefault();
               navegarCards(e.key === 'ArrowDown' ? 'baixo' : 'cima');
               return;
            }
         }
         if (estado.cardFocadoId !== null && elsDin.listaTarefas && elsDin.listaTarefas.contains(document.activeElement)) {
            if (e.key === ' ') { e.preventDefault(); alternarConclusao(estado.cardFocadoId); return; }
            if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement.dataset.action === 'editar') {
               e.preventDefault(); deletarTarefa(estado.cardFocadoId); return;
            }
         }
      }

      if (e.key === 'Tab') {
         if (soAberto && elsEstaticos.shortcutsOverlay)  { aplicarFocusTrap(e, elsEstaticos.shortcutsOverlay); return; }
         if (miAberto && elsEstaticos.modalImportar)     { aplicarFocusTrap(e, elsEstaticos.modalImportar); return; }
         if (moAberto && elsEstaticos.modalOverlay)      { aplicarFocusTrap(e, elsEstaticos.modalOverlay); }
      }
   });

   // Responde ao tema do sistema
   window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (!localStorage.getItem('vf-tema')) aplicarTema(e.matches ? 'dark' : 'light');
   });
}

// =============================================
// MODAL DE PERFIL
// =============================================
function abrirModalPerfil() {
   var usuario = window.authEstado ? window.authEstado.usuario : null;
   var nome    = (usuario && usuario.user_metadata && usuario.user_metadata.nome) ||
                 (usuario && usuario.email && usuario.email.split('@')[0]) || '';
   var email   = (usuario && usuario.email) || '';

   var inp = elsEstaticos.inputPerfilNome;
   var iem = elsEstaticos.inputPerfilEmail;
   var is1 = elsEstaticos.inputPerfilSenha;
   var is2 = elsEstaticos.inputPerfilSenha2;
   var av  = elsEstaticos.perfilAvatarPreview;
   var mp  = elsEstaticos.modalPerfil;

   if (inp) inp.value = nome;
   if (iem) iem.value = email;
   var is0 = elsEstaticos.inputPerfilSenhaAtual;
   if (is0) is0.value = '';
   if (is1) is1.value = '';
   if (is2) is2.value = '';

   // Fecha o accordion de senha
   var toggle = elsEstaticos.btnToggleSenha;
   var campos = elsEstaticos.perfilSenhaCampos;
   if (toggle) toggle.setAttribute('aria-expanded', 'false');
   if (campos) {
      campos.classList.remove('perfil-senha-campos--aberto');
      campos.setAttribute('aria-hidden', 'true');
      campos.querySelectorAll('input').forEach(function(i) { i.setAttribute('tabindex', '-1'); });
   }

   // Carrega avatar salvo (base64) ou usa inicial
   var avatarKey = 'vf-avatar' + (email ? '-' + email : '');
   var avatarSalvo = localStorage.getItem(avatarKey);
   if (av) {
      if (avatarSalvo) {
         av.innerHTML = '<img src="' + avatarSalvo + '" alt="Foto de perfil" />';
      } else {
         av.textContent = nome ? nome.charAt(0).toUpperCase() : 'U';
      }
   }

   // Oculta campo de senha se não há Supabase
   var senhaBloco = el('perfil-senha-bloco');
   if (senhaBloco) senhaBloco.style.display = window.supabaseClient ? '' : 'none';

   if (mp) { mp.classList.add('is-open'); mp.setAttribute('aria-hidden', 'false'); }
   setTimeout(function() { if (inp) inp.focus(); }, 60);
}

function fecharModalPerfil() {
   var mp = elsEstaticos.modalPerfil;
   if (mp) { mp.classList.remove('is-open'); mp.setAttribute('aria-hidden', 'true'); }
}

function salvarPerfil() {
   var inp = elsEstaticos.inputPerfilNome;
   var is1 = elsEstaticos.inputPerfilSenha;
   var is2 = elsEstaticos.inputPerfilSenha2;
   var nome = inp ? inp.value.trim() : '';
   var is0  = elsEstaticos.inputPerfilSenhaAtual;
   var s0   = is0 ? is0.value : '';
   var s1   = is1 ? is1.value : '';
   var s2   = is2 ? is2.value : '';
   var trocandoSenha = !!(s0 || s1 || s2);

   if (trocandoSenha) {
      if (!s0) { mostrarToast('Informe sua senha atual.', 'erro'); if (is0) is0.focus(); return; }
      if (!s1) { mostrarToast('Informe a nova senha.', 'erro'); if (is1) is1.focus(); return; }
      if (s1.length < 6) { mostrarToast('A nova senha precisa ter pelo menos 6 caracteres.', 'erro'); if (is1) is1.focus(); return; }
      if (s1 !== s2) { mostrarToast('As senhas não coincidem.', 'erro'); if (is2) is2.focus(); return; }
   }

   // Salva avatar se foi trocado (armazenado no dataset temporário)
   var av = elsEstaticos.perfilAvatarPreview;
   if (av && av.dataset.novoAvatar) {
      var usuario  = window.authEstado ? window.authEstado.usuario : null;
      var avatarKey = 'vf-avatar' + (usuario && usuario.email ? '-' + usuario.email : '');
      localStorage.setItem(avatarKey, av.dataset.novoAvatar);
      delete av.dataset.novoAvatar;
      // Atualiza sidebar
      var sa = qs('.sidebar__avatar');
      if (sa && nome) sa.textContent = nome.charAt(0).toUpperCase();
   }

   if (window.supabaseClient && window.authEstado && window.authEstado.usuario) {
      var payload = { data: { nome: nome } };
      if (trocandoSenha) {
         window.supabaseClient.auth.signInWithPassword({
            email: window.authEstado.usuario.email,
            password: s0
         }).then(function(reauth) {
            if (reauth.error) { mostrarToast('Senha atual incorreta.', 'erro'); return; }
            payload.password = s1;
            window.supabaseClient.auth.updateUser(payload).then(function(result) {
               if (result.error) { mostrarToast('Erro: ' + result.error.message, 'erro'); return; }
               if (window.authEstado.usuario) {
                  window.authEstado.usuario.user_metadata = window.authEstado.usuario.user_metadata || {};
                  window.authEstado.usuario.user_metadata.nome = nome;
               }
               atualizarInfoUsuario();
               fecharModalPerfil();
               mostrarToast('Perfil e senha atualizados.');
            });
         });
         return;
      }
      window.supabaseClient.auth.updateUser(payload).then(function(result) {
         if (result.error) { mostrarToast('Erro: ' + result.error.message, 'erro'); return; }
         if (window.authEstado.usuario) {
            window.authEstado.usuario.user_metadata = window.authEstado.usuario.user_metadata || {};
            window.authEstado.usuario.user_metadata.nome = nome;
         }
         atualizarInfoUsuario();
         fecharModalPerfil();
         mostrarToast(s1 ? 'Perfil e senha atualizados.' : 'Perfil atualizado.');
      });
   } else {
      // Modo local: apenas atualiza a sidebar
      if (window.authEstado && !window.authEstado.usuario) {
         window.authEstado.usuario = { user_metadata: { nome: nome }, email: '' };
      } else if (window.authEstado && window.authEstado.usuario) {
         window.authEstado.usuario.user_metadata = window.authEstado.usuario.user_metadata || {};
         window.authEstado.usuario.user_metadata.nome = nome;
      }
      atualizarInfoUsuario();
      fecharModalPerfil();
      mostrarToast('Perfil atualizado.');
   }
}

// =============================================
// ATUALIZAR INFO DO USUÁRIO NA SIDEBAR
// =============================================
function atualizarInfoUsuario() {
   var usuario = window.authEstado ? window.authEstado.usuario : null;
   if (!usuario) return;
   var nome = (usuario.user_metadata && usuario.user_metadata.nome) || usuario.email.split('@')[0] || 'Usuário';
   var su   = qs('.sidebar__username');
   var sa   = qs('.sidebar__avatar');
   if (su) su.textContent = nome;
   if (sa) sa.textContent = nome.charAt(0).toUpperCase();
}

// =============================================
// INICIALIZAÇÃO DO APP
// =============================================
function inicializarApp() {
   // Carrega do servidor se disponível, senão usa localStorage
   if (window.Sync && window.authEstado && window.authEstado.usuario && navigator.onLine) {
      window.Sync.carregarDoServidor(function(err, tarefasServidor) {
         if (tarefasServidor) {
            estado.tarefas = tarefasServidor;
            salvarTarefasLocal();
         } else {
            carregarTarefasLocal();
         }
         finalizarInicializacao();
      });
   } else {
      carregarTarefasLocal();
      finalizarInicializacao();
   }
}

function finalizarInicializacao() {
   atualizarInfoUsuario();
   var _mainInit = el('main-content');
   if (_mainInit) _mainInit.innerHTML = htmlListaView();
   resolverElsDinamicos();
   vincularEventosDinamicos();
   sincronizarEstado();
   inicializarPrintDate();

   // Ativa realtime se logado
   if (window.Sync && window.authEstado && window.authEstado.usuario) {
      window.Sync.ativarRealtime(function(tipo, dados) {
         // Mudança de outro dispositivo: recarrega do servidor
         if (window.Sync) {
            window.Sync.carregarDoServidor(function(err, tarefas) {
               if (tarefas) { estado.tarefas = tarefas; salvarTarefasLocal(); sincronizarEstado(); }
            });
         }
      });
      window.Sync.processarFila();
   }

   setTimeout(verificarNotificacoes, 1500);
}

// =============================================
// PONTO DE ENTRADA
// =============================================
document.addEventListener('DOMContentLoaded', function() {
   resolverEls();
   vincularEventosEstaticos();

   if (window.Auth && window.supabaseClient) {
      // Modo autenticado
      window.Auth.init(inicializarApp);
   } else {
      // Modo local (sem Supabase configurado)
      var appCont = el('app-container');
      var loadOv  = el('loading-overlay');
      if (appCont) appCont.style.display = 'flex';
      if (loadOv)  loadOv.style.display  = 'none';
      inicializarApp();
   }
});
