// Adapta o Netlify Blobs às quatro operações que a lógica do chat usa.
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
  };
}
