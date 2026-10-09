// Função do Netlify: batida de presença (contador de pessoas online).
import { getStore } from '@netlify/blobs';
import { presenca, lerCorpo } from '../../api/logica.mjs';
import { loja } from '../../api/loja-netlify.mjs';

export default async (req) => {
  if (req.method !== 'POST') return new Response('Método não permitido', { status: 405 });
  const corpo = lerCorpo(await req.text());
  if (!corpo) return Response.json({ erro: 'Pedido inválido.' }, { status: 400 });
  const r = await presenca(loja(getStore), corpo, Date.now());
  return Response.json(r.json, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
};

export const config = { path: '/api/presenca' };
