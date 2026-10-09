// Função do Netlify: ler (GET) e mandar (POST) mensagens do chat.
import { getStore } from '@netlify/blobs';
import { lerChat, enviarChat, podar, lerCorpo } from '../../api/logica.mjs';
import { loja, emSegundoPlano } from '../../api/loja-netlify.mjs';

export default async (req, context) => {
  const cab = { 'Cache-Control': 'no-store' };
  const ip = (context && context.ip) || '';
  try {
    if (req.method === 'GET') {
      const q = new URL(req.url).searchParams;
      const r = await lerChat(loja(getStore), { depois: q.get('depois') || '', id: q.get('id') || '' }, Date.now(), ip);
      return Response.json(r.json, { status: r.status, headers: cab });
    }
    if (req.method === 'POST') {
      const corpo = lerCorpo(await req.text());
      if (!corpo) return Response.json({ erro: 'Pedido inválido.' }, { status: 400, headers: cab });
      const store = loja(getStore);
      const agora = Date.now();
      const r = await enviarChat(store, corpo, agora, ip);
      if (r.status === 200 && Math.random() < 0.2) await emSegundoPlano(context, () => podar(store, agora));
      return Response.json(r.json, { status: r.status, headers: cab });
    }
    return new Response('Método não permitido', { status: 405 });
  } catch (e) {
    return Response.json({ erro: 'Tente de novo.' }, { status: 503, headers: cab });
  }
};

export const config = {
  path: '/api/chat',
  // leituras a cada 3 s de algumas pessoas na mesma rede + envios
  rateLimit: { windowLimit: 120, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
