// Função do Netlify: batida de presença (contador de pessoas online).
import { getStore } from '@netlify/blobs';
import { presenca, podar, lerCorpo } from '../../api/logica.mjs';
import { loja, emSegundoPlano } from '../../api/loja-netlify.mjs';

export default async (req, context) => {
  const cab = { 'Cache-Control': 'no-store' };
  if (req.method !== 'POST') return new Response('Método não permitido', { status: 405 });
  try {
    const corpo = lerCorpo(await req.text());
    if (!corpo) return Response.json({ erro: 'Pedido inválido.' }, { status: 400, headers: cab });
    const store = loja(getStore);
    const agora = Date.now();
    const r = await presenca(store, corpo, agora, (context && context.ip) || '');
    if (Math.random() < 0.1) await emSegundoPlano(context, () => podar(store, agora));
    return Response.json(r.json, { status: r.status, headers: cab });
  } catch (e) {
    return Response.json({ erro: 'Tente de novo.' }, { status: 503, headers: cab });
  }
};

export const config = {
  path: '/api/presenca',
  // por conexão: sobra folga pra várias pessoas na mesma rede
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
