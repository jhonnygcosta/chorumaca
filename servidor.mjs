// Servidor do jogo para a rede de casa: abra no celular pelo Wi-Fi.
// Uso: node servidor.mjs [porta]   (padrão: 8080)
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const PORTA = Number(process.argv[2] || process.env.PORTA || 8080);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

// Só os arquivos do jogo ficam visíveis na rede. Documentos, originais da campanha
// e arquivos de desenvolvimento continuam só no notebook.
const PERMITIDO = /^(index\.html|manifest\.webmanifest|(css|js|assets\/jogo)\/[^/].*)$/;

const vistos = new Set();

const servidor = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }
  let caminho;
  try {
    caminho = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }
  if (caminho === '/') caminho = '/index.html';
  const alvo = path.normalize(path.join(RAIZ, caminho));
  const relativo = path.relative(RAIZ, alvo).split(path.sep).join('/');
  if (relativo.startsWith('..') || path.isAbsolute(relativo) || !PERMITIDO.test(relativo)) {
    naoAchou(res);
    return;
  }
  try {
    const info = await stat(alvo);
    if (!info.isFile()) throw new Error('não é arquivo');
    const dados = await readFile(alvo);
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(alvo).toLowerCase()] || 'application/octet-stream',
      'Content-Length': dados.length,
      // sem cache: cada recarga pega a versão mais nova do jogo
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : dados);
    if (relativo === 'index.html') avisarAparelho(req);
  } catch {
    naoAchou(res);
  }
});

function naoAchou(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Não encontrado');
}

function avisarAparelho(req) {
  const ip = (req.socket.remoteAddress || '').replace('::ffff:', '');
  const agente = req.headers['user-agent'] || '';
  const tipo = /iPhone|iPad/.test(agente) ? 'iPhone/iPad' : /Android/.test(agente) ? 'Android' : 'computador';
  const hora = new Date().toLocaleTimeString('pt-BR');
  console.log(`  ${hora}  jogo aberto em ${tipo} (${ip})${vistos.has(ip) ? '' : '  ← aparelho novo'}`);
  vistos.add(ip);
}

function enderecosDaRede() {
  const lista = [];
  for (const [nome, ifs] of Object.entries(networkInterfaces())) {
    for (const i of ifs || []) {
      if (i.family === 'IPv4' && !i.internal && !i.address.startsWith('169.254.')) lista.push({ nome, ip: i.address });
    }
  }
  // Wi-Fi primeiro
  return lista.sort((a, b) => (/wi-?fi|wlan/i.test(b.nome) ? 1 : 0) - (/wi-?fi|wlan/i.test(a.nome) ? 1 : 0));
}

servidor.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`\nA porta ${PORTA} já está em uso. O servidor do jogo provavelmente já está rodando.`);
    console.log(`Se não estiver, rode com outra porta: node servidor.mjs ${PORTA + 1}\n`);
  } else {
    console.log('\nNão consegui iniciar o servidor: ' + e.message + '\n');
  }
  process.exit(1);
});

servidor.listen(PORTA, '0.0.0.0', () => {
  const ends = enderecosDaRede();
  console.log('\n  Chorumaçã O Jogo! está no ar\n');
  console.log(`  Neste notebook:  http://localhost:${PORTA}`);
  if (ends.length) {
    console.log('\n  No celular (mesmo Wi-Fi), digite no navegador:');
    ends.forEach((e, i) => console.log(`    ${i === 0 ? '→' : ' '} http://${e.ip}:${PORTA}   (${e.nome})`));
  } else {
    console.log('\n  Não achei rede Wi-Fi. Conecte o notebook ao Wi-Fi e reinicie o servidor.');
  }
  console.log('\n  Deixe esta janela aberta enquanto joga. Para desligar, feche a janela ou aperte Ctrl+C.\n');
});
