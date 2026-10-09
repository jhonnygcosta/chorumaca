// Função do Netlify: ler (GET) e mandar (POST) mensagens do chat.
import { getStore } from '@netlify/blobs';
import { lerChat, enviarChat, lerCorpo } from '../../api/logica.mjs';
import { loja } from '../../api/loja-netlify.mjs';

export default async (req) => {
  const cab = { 'Cache-Control': 'no-store' };
  if (req.method === 'GET') {
    const depois = new URL(req.url).searchParams.get('depois') || '';
    const r = await lerChat(loja(getStore), depois);
    return Response.json(r.json, { status: r.status, headers: cab });
  }
  if (req.method === 'POST') {
    const corpo = lerCorpo(await req.text());
    if (!corpo) return Response.json({ erro: 'Pedido inválido.' }, { status: 400, headers: cab });
    const r = await enviarChat(loja(getStore), corpo, Date.now());
    return Response.json(r.json, { status: r.status, headers: cab });
  }
  return new Response('Método não permitido', { status: 405 });
};

export const config = { path: '/api/chat' };
