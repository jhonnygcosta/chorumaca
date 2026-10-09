// Quando o jogo roda dentro do claude.ai com a conta da pessoa, o progresso também
// fica guardado na conta, e dá pra continuar em outro aparelho. Fora dele, nada muda.
(function (CH) {
  let doc = null;
  let gravando = false;
  let pendente = false;
  let ultimaGravacao = 0;
  let timer = null;
  const INTERVALO = 30000;

  async function iniciar() {
    const claude = window.claude;
    if (!claude || typeof claude.use !== 'function') return;
    try {
      const user = await claude.use('user');
      if (!user) return;
      const uid = await user.id();
      if (!uid) return;
      const db = await claude.use('db');
      if (!db) return;
      doc = db.doc('data/users/' + uid + '/save');
      const snap = await doc.get();
      const remoto = snap.exists ? snap.data().estado : null;
      if (remoto && remoto.ultimo > CH.estado.s.ultimo + 5000) {
        CH.estado.substituir(remoto);
        CH.ui.toast('Progresso carregado da sua conta');
      } else {
        await gravar();
      }
      CH.ev.on('salvou', agendar);
      document.addEventListener('visibilitychange', () => { if (document.hidden) gravar(); });
    } catch (e) {
      doc = null;
    }
  }

  // Grava no máximo a cada 30 s, só depois de uma ação de verdade.
  function agendar() {
    if (!doc) return;
    clearTimeout(timer);
    const espera = Math.max(1500, INTERVALO - (Date.now() - ultimaGravacao));
    timer = setTimeout(gravar, espera);
  }

  async function gravar() {
    if (!doc) return;
    if (gravando) { pendente = true; return; }
    gravando = true;
    try {
      await doc.set({ estado: JSON.parse(JSON.stringify(CH.estado.s)), em: Date.now() });
      ultimaGravacao = Date.now();
    } catch (e) {
      const cod = e && e.code;
      if (cod === 'invalid_argument' || cod === 'revoked' || cod === 'not_granted' || cod === 'capability_disabled') doc = null;
    }
    gravando = false;
    if (pendente) { pendente = false; agendar(); }
  }

  CH.sincronia = { iniciar };
})(window.CH);
