// sync.js — Sincronização com Supabase
// Expõe window.Sync com todos os métodos
// Script clássico — sem import/export

(function() {
   'use strict';

   var FILA_KEY = 'vf-fila-sync';
   var realtimeChannel = null;

   // =============================================
   // FILA OFFLINE
   // =============================================
   function lerFila() {
      try { return JSON.parse(localStorage.getItem(FILA_KEY) || '[]'); }
      catch(e) { return []; }
   }

   function salvarFila(fila) {
      try { localStorage.setItem(FILA_KEY, JSON.stringify(fila)); }
      catch(e) {}
   }

   function adicionarNaFila(op) {
      var fila = lerFila();
      var idx  = fila.findIndex(function(o) {
         return o.tarefaId === op.tarefaId && o.tipo === op.tipo;
      });
      if (idx >= 0) fila[idx] = op;
      else fila.push(op);
      salvarFila(fila);
   }

   // =============================================
   // CONVERSÃO FRONTEND ↔ BANCO
   // =============================================
   function paraoBanco(tarefa) {
      var usuario = window.authEstado && window.authEstado.usuario;
      return {
         id:         tarefa.id,
         user_id:    usuario ? usuario.id : null,
         titulo:     tarefa.titulo,
         prioridade: tarefa.prioridade,
         vencimento: tarefa.vencimento || null,
         notas:      tarefa.notas || null,
         concluida:  tarefa.concluida,
         criada_em:  tarefa.criadaEm
      };
   }

   function doBanco(row) {
      return {
         id:         row.id,
         titulo:     row.titulo,
         prioridade: row.prioridade,
         vencimento: row.vencimento || null,
         notas:      row.notas || null,
         concluida:  row.concluida,
         criadaEm:   row.criada_em
      };
   }

   function usuarioLogado() {
      return window.authEstado && window.authEstado.usuario && window.supabaseClient;
   }

   // =============================================
   // CRUD SUPABASE
   // =============================================
   function carregarDoServidor(callback) {
      if (!usuarioLogado()) { callback(null, null); return; }

      window.supabaseClient
         .from('tarefas')
         .select('*')
         .order('id', { ascending: false })
         .then(function(result) {
            if (result.error) { console.error('Sync: erro ao carregar', result.error); callback(null, null); return; }
            callback(null, result.data.map(doBanco));
         })
         .catch(function(err) { console.error('Sync: exceção ao carregar', err); callback(null, null); });
   }

   function sincronizarTarefa(tarefa) {
      if (!usuarioLogado()) { adicionarNaFila({ tipo: 'upsert', tarefaId: tarefa.id, dados: tarefa }); return; }
      if (!navigator.onLine) { adicionarNaFila({ tipo: 'upsert', tarefaId: tarefa.id, dados: tarefa }); return; }

      window.supabaseClient
         .from('tarefas')
         .upsert(paraoBanco(tarefa), { onConflict: 'id', ignoreDuplicates: false })
         .then(function(result) {
            if (result.error) { adicionarNaFila({ tipo: 'upsert', tarefaId: tarefa.id, dados: tarefa }); }
         })
         .catch(function() { adicionarNaFila({ tipo: 'upsert', tarefaId: tarefa.id, dados: tarefa }); });
   }

   function deletarDoServidor(tarefaId) {
      if (!usuarioLogado()) { adicionarNaFila({ tipo: 'delete', tarefaId: tarefaId }); return; }
      if (!navigator.onLine) { adicionarNaFila({ tipo: 'delete', tarefaId: tarefaId }); return; }

      window.supabaseClient
         .from('tarefas')
         .delete()
         .eq('id', tarefaId)
         .then(function(result) {
            if (result.error) { adicionarNaFila({ tipo: 'delete', tarefaId: tarefaId }); }
         })
         .catch(function() { adicionarNaFila({ tipo: 'delete', tarefaId: tarefaId }); });
   }

   function sincronizarLote(tarefas) {
      if (!usuarioLogado() || !navigator.onLine || !tarefas.length) return;

      window.supabaseClient
         .from('tarefas')
         .upsert(tarefas.map(paraoBanco), { onConflict: 'id', ignoreDuplicates: false })
         .then(function(result) {
            if (result.error) console.error('Sync: erro no lote', result.error);
         })
         .catch(function(err) { console.error('Sync: exceção no lote', err); });
   }

   // =============================================
   // FLUSH DA FILA OFFLINE
   // =============================================
   function processarFila() {
      if (!usuarioLogado() || !navigator.onLine) return;

      var fila = lerFila();
      if (!fila.length) return;

      var falhas = [];

      function processarProxima(idx) {
         if (idx >= fila.length) { salvarFila(falhas); return; }
         var op = fila[idx];

         var promise;
         if (op.tipo === 'upsert' && op.dados) {
            promise = window.supabaseClient.from('tarefas')
               .upsert(paraoBanco(op.dados), { onConflict: 'id' });
         } else if (op.tipo === 'delete') {
            promise = window.supabaseClient.from('tarefas')
               .delete().eq('id', op.tarefaId);
         } else {
            processarProxima(idx + 1);
            return;
         }

         promise.then(function(result) {
            if (result.error) falhas.push(op);
            processarProxima(idx + 1);
         }).catch(function() {
            falhas.push(op);
            processarProxima(idx + 1);
         });
      }

      processarProxima(0);
   }

   // =============================================
   // REALTIME
   // =============================================
   function ativarRealtime(onMudanca) {
      if (!usuarioLogado()) return;
      if (realtimeChannel) window.supabaseClient.removeChannel(realtimeChannel);

      realtimeChannel = window.supabaseClient
         .channel('tarefas-' + window.authEstado.usuario.id)
         .on('postgres_changes', {
            event:  '*',
            schema: 'public',
            table:  'tarefas',
            filter: 'user_id=eq.' + window.authEstado.usuario.id
         }, function(payload) {
            if (onMudanca) onMudanca(payload.eventType, payload.new || payload.old);
         })
         .subscribe();
   }

   function desativarRealtime() {
      if (realtimeChannel && window.supabaseClient) {
         window.supabaseClient.removeChannel(realtimeChannel);
         realtimeChannel = null;
      }
   }

   // Reconecta quando volta online
   window.addEventListener('online', function() {
      processarFila();
   });

   // =============================================
   // MÓDULO PÚBLICO: window.Sync
   // =============================================
   window.Sync = {
      carregarDoServidor:  carregarDoServidor,
      sincronizarTarefa:   sincronizarTarefa,
      deletarDoServidor:   deletarDoServidor,
      sincronizarLote:     sincronizarLote,
      processarFila:       processarFila,
      ativarRealtime:      ativarRealtime,
      desativarRealtime:   desativarRealtime
   };

})();
