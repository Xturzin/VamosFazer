// auth.js — Módulo de autenticação
// Expõe window.Auth com todos os métodos necessários
// Script clássico — sem import/export

(function() {
   'use strict';

   // =============================================
   // UTILITÁRIOS INTERNOS
   // =============================================
   function escapar(str) {
      return String(str)
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#39;');
   }

   function traduzirErro(erro) {
      if (!erro) return 'Algo deu errado. Tente novamente.';
      var msg = (erro.message || erro.error_description || '').toLowerCase();
      if (msg.includes('invalid login credentials'))    return 'E-mail ou senha incorretos.';
      if (msg.includes('email not confirmed'))          return 'Confirme seu e-mail antes de entrar.';
      if (msg.includes('user already registered'))      return 'Este e-mail já está cadastrado.';
      if (msg.includes('password should be at least'))  return 'A senha precisa ter pelo menos 6 caracteres.';
      if (msg.includes('email rate limit'))             return 'Muitas tentativas. Aguarde alguns minutos.';
      if (msg.includes('over_email_send_rate_limit'))   return 'Muitas tentativas. Aguarde alguns minutos.';
      if (msg.includes('signup_disabled'))              return 'Cadastros temporariamente desativados.';
      if (msg.includes('network'))                      return 'Erro de conexão. Verifique sua internet.';
      return erro.message || 'Algo deu errado. Tente novamente.';
   }

   function setLoading(formEl, loading) {
      if (!formEl) return;
      var btn    = formEl.querySelector('.auth-btn-submit');
      var texto  = formEl.querySelector('.auth-btn-submit__texto');
      var loader = formEl.querySelector('.auth-btn-submit__loading');
      if (!btn) return;
      btn.disabled = loading;
      if (texto)  texto.style.opacity  = loading ? '0' : '1';
      if (loader) loader.style.opacity = loading ? '1' : '0';
   }

   function mostrarErro(id, msg) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = msg || '';
      el.classList.toggle('auth-erro--visivel', !!msg);
   }

   function limparErros() {
      var erros = document.querySelectorAll('.auth-erro');
      erros.forEach(function(el) {
         el.textContent = '';
         el.classList.remove('auth-erro--visivel');
      });
   }

   function atualizarForcaSenha(senha) {
      var barra = document.getElementById('senha-forca-barra');
      if (!barra) return;
      var criterios = [
         senha.length >= 8,
         /[a-z]/.test(senha),
         /[A-Z]/.test(senha),
         /[0-9]/.test(senha),
         /[^a-zA-Z0-9]/.test(senha)
      ];
      var pontos  = criterios.filter(Boolean).length;
      var cores   = ['', '#A85570', '#966A2C', '#7339D4', '#488862', '#059669'];
      var largura = ['0%', '20%', '40%', '60%', '80%', '100%'];
      barra.style.width           = largura[pontos];
      barra.style.backgroundColor = cores[pontos];
   }

   // =============================================
   // HTML DA TELA DE AUTENTICAÇÃO
   // =============================================
   function htmlTelaAuth() {
      return '' +
         '<div id="auth-page" class="auth-page">' +
            '<div class="auth-card">' +
               '<div class="auth-brand">' +
                  '<svg width="28" height="28" viewBox="0 0 22 22" fill="none" aria-hidden="true">' +
                     '<path d="M4.5 11.5L9 16L17.5 7" stroke="#7339D4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                  '</svg>' +
                  '<span class="auth-brand__nome">Vamos Fazer?</span>' +
               '</div>' +

               '<div class="auth-tabs" role="tablist" aria-label="Modo de acesso">' +
                  '<button class="auth-tab auth-tab--ativo" id="tab-login" role="tab" aria-selected="true" aria-controls="painel-login">Entrar</button>' +
                  '<button class="auth-tab" id="tab-cadastro" role="tab" aria-selected="false" aria-controls="painel-cadastro">Criar conta</button>' +
               '</div>' +

               // Painel login
               '<div id="painel-login" class="auth-painel auth-painel--ativo" role="tabpanel" aria-labelledby="tab-login">' +
                  '<form class="auth-form" id="form-login" novalidate>' +
                     '<div class="auth-field">' +
                        '<label class="auth-label" for="login-email">E-mail</label>' +
                        '<input type="email" id="login-email" class="auth-input" placeholder="seu@email.com" autocomplete="email" required />' +
                     '</div>' +
                     '<div class="auth-field">' +
                        '<div class="auth-label-row">' +
                           '<label class="auth-label" for="login-senha">Senha</label>' +
                           '<button type="button" class="auth-link" id="btn-esqueci">Esqueci a senha</button>' +
                        '</div>' +
                        '<div class="auth-input-wrapper">' +
                           '<input type="password" id="login-senha" class="auth-input" placeholder="••••••••" autocomplete="current-password" required />' +
                           '<button type="button" class="auth-toggle-senha" id="toggle-senha-login" aria-label="Mostrar senha">' +
                              '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 7C2.5 4 4.5 2.5 7 2.5S11.5 4 13 7c-1.5 3-3.5 4.5-6 4.5S2.5 10 1 7z" stroke="currentColor" stroke-width="1.2"/><circle cx="7" cy="7" r="1.8" stroke="currentColor" stroke-width="1.2"/></svg>' +
                           '</button>' +
                        '</div>' +
                     '</div>' +
                     '<div class="auth-erro" id="erro-login" role="alert" aria-live="polite"></div>' +
                     '<button type="submit" class="auth-btn-submit" id="btn-login">' +
                        '<span class="auth-btn-submit__texto">Entrar</span>' +
                        '<span class="auth-btn-submit__loading" aria-hidden="true">' +
                           '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="28" stroke-dashoffset="10"><animateTransform attributeName="transform" type="rotate" values="0 8 8;360 8 8" dur="0.8s" repeatCount="indefinite"/></circle></svg>' +
                        '</span>' +
                     '</button>' +
                  '</form>' +
               '</div>' +

               // Painel cadastro
               '<div id="painel-cadastro" class="auth-painel" role="tabpanel" aria-labelledby="tab-cadastro">' +
                  '<form class="auth-form" id="form-cadastro" novalidate>' +
                     '<div class="auth-field">' +
                        '<label class="auth-label" for="cadastro-nome">Seu nome</label>' +
                        '<input type="text" id="cadastro-nome" class="auth-input" placeholder="Como quer ser chamado?" autocomplete="given-name" maxlength="60" />' +
                     '</div>' +
                     '<div class="auth-field">' +
                        '<label class="auth-label" for="cadastro-email">E-mail</label>' +
                        '<input type="email" id="cadastro-email" class="auth-input" placeholder="seu@email.com" autocomplete="email" required />' +
                     '</div>' +
                     '<div class="auth-field">' +
                        '<label class="auth-label" for="cadastro-senha">Senha</label>' +
                        '<div class="auth-input-wrapper">' +
                           '<input type="password" id="cadastro-senha" class="auth-input" placeholder="Mínimo 8 caracteres" autocomplete="new-password" minlength="8" required />' +
                           '<button type="button" class="auth-toggle-senha" id="toggle-senha-cadastro" aria-label="Mostrar senha">' +
                              '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 7C2.5 4 4.5 2.5 7 2.5S11.5 4 13 7c-1.5 3-3.5 4.5-6 4.5S2.5 10 1 7z" stroke="currentColor" stroke-width="1.2"/><circle cx="7" cy="7" r="1.8" stroke="currentColor" stroke-width="1.2"/></svg>' +
                           '</button>' +
                        '</div>' +
                        '<div class="senha-forca" id="senha-forca" aria-label="Força da senha"><div class="senha-forca__barra" id="senha-forca-barra"></div></div>' +
                     '</div>' +
                     '<div class="auth-erro" id="erro-cadastro" role="alert" aria-live="polite"></div>' +
                     '<button type="submit" class="auth-btn-submit" id="btn-cadastro">' +
                        '<span class="auth-btn-submit__texto">Criar conta</span>' +
                        '<span class="auth-btn-submit__loading" aria-hidden="true">' +
                           '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="28" stroke-dashoffset="10"><animateTransform attributeName="transform" type="rotate" values="0 8 8;360 8 8" dur="0.8s" repeatCount="indefinite"/></circle></svg>' +
                        '</span>' +
                     '</button>' +
                  '</form>' +
               '</div>' +

               // Painel recuperar senha
               '<div id="painel-recuperar" class="auth-painel" style="display:none">' +
                  '<p class="auth-info-texto">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>' +
                  '<form class="auth-form" id="form-recuperar" novalidate>' +
                     '<div class="auth-field">' +
                        '<label class="auth-label" for="recuperar-email">E-mail</label>' +
                        '<input type="email" id="recuperar-email" class="auth-input" placeholder="seu@email.com" autocomplete="email" required />' +
                     '</div>' +
                     '<div class="auth-erro" id="erro-recuperar" role="alert" aria-live="polite"></div>' +
                     '<button type="submit" class="auth-btn-submit" id="btn-recuperar">' +
                        '<span class="auth-btn-submit__texto">Enviar link</span>' +
                        '<span class="auth-btn-submit__loading" aria-hidden="true">' +
                           '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="28" stroke-dashoffset="10"><animateTransform attributeName="transform" type="rotate" values="0 8 8;360 8 8" dur="0.8s" repeatCount="indefinite"/></circle></svg>' +
                        '</span>' +
                     '</button>' +
                     '<button type="button" class="auth-link auth-link--voltar" id="btn-voltar-login">← Voltar ao login</button>' +
                  '</form>' +
               '</div>' +

               // Painel confirmação
               '<div id="painel-confirmacao" class="auth-painel" style="display:none">' +
                  '<div class="auth-confirmacao">' +
                     '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="20" cy="20" r="19" stroke="var(--priority-baixa-color)" stroke-width="1.5"/><path d="M12 20l6 6 10-12" stroke="var(--priority-baixa-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
                     '<p class="auth-confirmacao__titulo">Verifique seu e-mail</p>' +
                     '<p class="auth-confirmacao__sub" id="confirmacao-sub"></p>' +
                     '<button type="button" class="auth-link" id="btn-reenviar">Reenviar e-mail</button>' +
                  '</div>' +
               '</div>' +

            '</div>' +
            '<p class=\"auth-footer\">Suas tarefas, seu ritmo.</p>' +
            '<button type=\"button\" id=\"btn-visitante\" style=\"' +
               'display:block;width:100%;max-width:360px;margin:0 auto 16px;' +
               'background:none;border:1px solid rgba(115,57,212,0.3);border-radius:10px;' +
               'padding:10px;font-size:.82rem;font-weight:600;color:#a78bfa;cursor:pointer;' +
               'font-family:inherit;transition:border-color .2s,color .2s;' +
            '\">👀 Entrar como visitante</button>' +
         '</div>';
   }

   // =============================================
   // MOSTRAR / ESCONDER TELA DE AUTH
   // =============================================
   function mostrarTelaAuth() {
      // Esconde o app
      var appContainer = document.getElementById('app-container');
      var loadingOverlay = document.getElementById('loading-overlay');
      if (appContainer) appContainer.style.display = 'none';
      if (loadingOverlay) loadingOverlay.style.display = 'none';

      // Remove auth-page anterior se existir
      var anterior = document.getElementById('auth-page');
      if (anterior) anterior.remove();

      // Injeta tela de auth no body
      var div = document.createElement('div');
      div.innerHTML = htmlTelaAuth();
      document.body.appendChild(div.firstElementChild);

      vincularEventosAuth();
   }

   function esconderTelaAuth() {
      var authPage = document.getElementById('auth-page');
      if (authPage) authPage.remove();
      var appContainer = document.getElementById('app-container');
      if (appContainer) appContainer.style.display = 'flex';
      var loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) loadingOverlay.style.display = 'none';
   }

   // =============================================
   // EVENTOS DA TELA DE AUTH
   // =============================================
   function vincularEventosAuth() {
      var tabLogin    = document.getElementById('tab-login');
      var tabCadastro = document.getElementById('tab-cadastro');
      var formLogin   = document.getElementById('form-login');
      var formCadast  = document.getElementById('form-cadastro');
      var formRecup   = document.getElementById('form-recuperar');
      var btnEsqueci  = document.getElementById('btn-esqueci');
      var btnVoltar   = document.getElementById('btn-voltar-login');
      var btnReenviar = document.getElementById('btn-reenviar');
      var inputSenhaC = document.getElementById('cadastro-senha');

      function ativarAba(modo) {
         var isLogin = (modo === 'login');
         if (tabLogin)    { tabLogin.classList.toggle('auth-tab--ativo', isLogin); tabLogin.setAttribute('aria-selected', String(isLogin)); }
         if (tabCadastro) { tabCadastro.classList.toggle('auth-tab--ativo', !isLogin); tabCadastro.setAttribute('aria-selected', String(!isLogin)); }
         var pLogin   = document.getElementById('painel-login');
         var pCadast  = document.getElementById('painel-cadastro');
         var pRecup   = document.getElementById('painel-recuperar');
         if (pLogin)  pLogin.classList.toggle('auth-painel--ativo', isLogin);
         if (pCadast) pCadast.classList.toggle('auth-painel--ativo', !isLogin);
         if (pRecup)  pRecup.style.display = 'none';
         limparErros();
      }

      if (tabLogin)    tabLogin.addEventListener('click',    function() { ativarAba('login'); });
      if (tabCadastro) tabCadastro.addEventListener('click', function() { ativarAba('cadastro'); });

      // Toggle senha
      document.querySelectorAll('.auth-toggle-senha').forEach(function(btn) {
         btn.addEventListener('click', function() {
            var inputId = btn.id === 'toggle-senha-login' ? 'login-senha' : 'cadastro-senha';
            var input   = document.getElementById(inputId);
            if (!input) return;
            var isTexto = input.type === 'text';
            input.type  = isTexto ? 'password' : 'text';
            btn.setAttribute('aria-label', isTexto ? 'Mostrar senha' : 'Ocultar senha');
         });
      });

      // Força da senha
      if (inputSenhaC) {
         inputSenhaC.addEventListener('input', function() {
            atualizarForcaSenha(this.value);
         });
      }

      // Esqueci a senha
      if (btnEsqueci) {
         btnEsqueci.addEventListener('click', function() {
            var pLogin  = document.getElementById('painel-login');
            var pCadast = document.getElementById('painel-cadastro');
            var pRecup  = document.getElementById('painel-recuperar');
            if (pLogin)  pLogin.classList.remove('auth-painel--ativo');
            if (pCadast) pCadast.classList.remove('auth-painel--ativo');
            if (pRecup)  pRecup.style.display = 'block';
            var emailLogin = document.getElementById('login-email');
            var emailRecup = document.getElementById('recuperar-email');
            if (emailLogin && emailRecup && emailLogin.value) {
               emailRecup.value = emailLogin.value;
            }
         });
      }

      if (btnVoltar) {
         btnVoltar.addEventListener('click', function() {
            var pRecup = document.getElementById('painel-recuperar');
            var pLogin = document.getElementById('painel-login');
            if (pRecup) pRecup.style.display = 'none';
            if (pLogin) pLogin.classList.add('auth-painel--ativo');
            if (tabLogin) { tabLogin.classList.add('auth-tab--ativo'); tabLogin.setAttribute('aria-selected', 'true'); }
            if (tabCadastro) { tabCadastro.classList.remove('auth-tab--ativo'); tabCadastro.setAttribute('aria-selected', 'false'); }
            limparErros();
         });
      }

      // Submit login
      if (formLogin) {
         formLogin.addEventListener('submit', function(e) {
            e.preventDefault();
            limparErros();
            var email = (document.getElementById('login-email') || {}).value || '';
            var senha = (document.getElementById('login-senha') || {}).value || '';
            email = email.trim();
            if (!email || !senha) { mostrarErro('erro-login', 'Preencha e-mail e senha.'); return; }
            setLoading(formLogin, true);
            window.Auth.login(email, senha, function(err) {
               setLoading(formLogin, false);
               if (err) { mostrarErro('erro-login', traduzirErro(err)); }
               // sucesso: onAuthStateChange cuida do resto
            });
         });
      }

      // Submit cadastro
      if (formCadast) {
         formCadast.addEventListener('submit', function(e) {
            e.preventDefault();
            limparErros();
            var nome  = ((document.getElementById('cadastro-nome') || {}).value || '').trim();
            var email = ((document.getElementById('cadastro-email') || {}).value || '').trim();
            var senha = (document.getElementById('cadastro-senha') || {}).value || '';
            if (!email || !senha) { mostrarErro('erro-cadastro', 'Preencha e-mail e senha.'); return; }
            if (senha.length < 8) { mostrarErro('erro-cadastro', 'A senha precisa ter pelo menos 8 caracteres.'); return; }
            setLoading(formCadast, true);
            window.Auth.cadastro(nome, email, senha, function(err) {
               setLoading(formCadast, false);
               if (err) { mostrarErro('erro-cadastro', traduzirErro(err)); return; }
               // Mostra confirmação
               var pCadast = document.getElementById('painel-cadastro');
               var pConf   = document.getElementById('painel-confirmacao');
               var sub     = document.getElementById('confirmacao-sub');
               if (pCadast) pCadast.classList.remove('auth-painel--ativo');
               if (pConf)   pConf.style.display = 'block';
               if (sub)     sub.textContent = 'Enviamos um link para ' + email + '. Verifique sua caixa de entrada.';
            });
         });
      }

      // Submit recuperar senha
      if (formRecup) {
         formRecup.addEventListener('submit', function(e) {
            e.preventDefault();
            limparErros();
            var email = ((document.getElementById('recuperar-email') || {}).value || '').trim();
            if (!email) { mostrarErro('erro-recuperar', 'Informe seu e-mail.'); return; }
            setLoading(formRecup, true);
            window.Auth.recuperarSenha(email, function(err) {
               setLoading(formRecup, false);
               if (err) { mostrarErro('erro-recuperar', traduzirErro(err)); return; }
               var pRecup = document.getElementById('painel-recuperar');
               var pConf  = document.getElementById('painel-confirmacao');
               var sub    = document.getElementById('confirmacao-sub');
               if (pRecup) pRecup.style.display = 'none';
               if (pConf)  pConf.style.display = 'block';
               if (sub)    sub.textContent = 'Enviamos um link para ' + email + '. Verifique sua caixa de entrada.';
            });
         });
      }

      // Reenviar e-mail
      var btnVisitante = document.getElementById('btn-visitante');
      if (btnVisitante) {
         btnVisitante.addEventListener('click', function() {
            window._modoVisitante = true;
            esconderTelaAuth();
            if (window._callbackApp) window._callbackApp();
         });
      }

      if (btnReenviar) {
         btnReenviar.addEventListener('click', function() {
            var email = ((document.getElementById('cadastro-email') || {}).value) ||
                        ((document.getElementById('recuperar-email') || {}).value) || '';
            email = email.trim();
            if (!email || !window.supabaseClient) return;
            window.supabaseClient.auth.resend({ type: 'signup', email: email });
            btnReenviar.textContent = 'Enviado!';
            setTimeout(function() { btnReenviar.textContent = 'Reenviar e-mail'; }, 3000);
         });
      }
   }

   // =============================================
   // MÓDULO PÚBLICO: window.Auth
   // =============================================
   window.Auth = {

      // Inicializa: checa sessão e direciona
      init: function(callbackApp) {
         window._callbackApp = callbackApp;

         if (!window.supabaseClient) {
            if (callbackApp) callbackApp();
            return;
         }

         window.supabaseClient.auth.getSession(function(err, result) {
            // API v2 usa promise — vamos usar then
         });

         window.supabaseClient.auth.getSession().then(function(result) {
            var session = result && result.data && result.data.session;

            if (session && session.user) {
               window.authEstado.usuario = session.user;
               window.authEstado.sessao  = session;
               if (callbackApp) callbackApp();
            } else {
               mostrarTelaAuth();
            }
         }).catch(function() {
            mostrarTelaAuth();
         });

         // Listener de mudanças de auth
         window.supabaseClient.auth.onAuthStateChange(function(event, session) {
            if (event === 'SIGNED_IN' && session) {
               window.authEstado.usuario = session.user;
               window.authEstado.sessao  = session;
               esconderTelaAuth();
               if (callbackApp) callbackApp();
            }

            if (event === 'SIGNED_OUT') {
               window.authEstado.usuario = null;
               window.authEstado.sessao  = null;
               if (window.Sync) window.Sync.desativarRealtime();
               // Limpa dados locais da sessão anterior
               localStorage.removeItem('vamos-fazer-tarefas');
               mostrarTelaAuth();
            }
         });
      },

      login: function(email, senha, callback) {
         if (!window.supabaseClient) { callback({ message: 'Supabase não configurado.' }); return; }
         window.supabaseClient.auth.signInWithPassword({ email: email, password: senha })
            .then(function(result) {
               if (result.error) { callback(result.error); return; }
               callback(null, result.data.session);
            })
            .catch(function(err) { callback(err); });
      },

      cadastro: function(nome, email, senha, callback) {
         if (!window.supabaseClient) { callback({ message: 'Supabase não configurado.' }); return; }
         window.supabaseClient.auth.signUp({
            email: email,
            password: senha,
            options: {
               data: { nome: nome },
               emailRedirectTo: window.location.origin
            }
         }).then(function(result) {
            if (result.error) { callback(result.error); return; }
            callback(null, result.data);
         }).catch(function(err) { callback(err); });
      },

      logout: function(callback) {
         if (!window.supabaseClient) {
            window.authEstado.usuario = null;
            mostrarTelaAuth();
            if (callback) callback();
            return;
         }
         window.supabaseClient.auth.signOut().then(function() {
            if (callback) callback();
         });
      },

      recuperarSenha: function(email, callback) {
         if (!window.supabaseClient) { callback({ message: 'Supabase não configurado.' }); return; }
         window.supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '?reset=true'
         }).then(function(result) {
            if (result.error) { callback(result.error); return; }
            callback(null);
         }).catch(function(err) { callback(err); });
      },

      getUsuario: function() {
         return window.authEstado ? window.authEstado.usuario : null;
      }
   };

})();
