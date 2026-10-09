// Adapta o Netlify Blobs às operações que a lógica do chat usa.
// Consistência forte: quem manda uma mensagem já a vê na leitura seguinte.
export function loja(getStore) {
  const st = getStore({ name: 'chorumaca-online', consistency: 'strong' });
  return {
    get: (k) => st.get(k, { type: 'json' }),
    set: (k, v) => st.setJSON(k, v),
    list: async (prefixo) => {
      const { blobs } = await st.list({ prefix: prefixo });
      return blobs.map((b) => b.key);
    },
    del: (k) => st.delete(k),
    // grava só se a chave ainda não existe (atômico no Netlify Blobs 10+)
    criar: async (k, v) => {
      const r = await st.setJSON(k, v, { onlyIfNew: true });
      return !r || r.modified !== false;
    },
  };
}

// Roda uma tarefa depois da resposta, quando o Netlify oferece isso; senão, espera ela.
export async function emSegundoPlano(context, tarefa) {
  const p = Promise.resolve().then(tarefa).catch(() => {});
  if (context && typeof context.waitUntil === 'function') context.waitUntil(p);
  else await p;
}
