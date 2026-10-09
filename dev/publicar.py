# Gera publicar/index.html no formato de página do claude.ai (sem doctype, html, head e body).
import re, pathlib
raiz = pathlib.Path(__file__).resolve().parent.parent
html = (raiz / 'index.html').read_text(encoding='utf-8')
head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
linhas = [l for l in head.splitlines() if l.strip() and not re.search(r'<meta charset|name="viewport"|rel="manifest"|rel="icon"|rel="apple-touch-icon"', l)]
saida = '\n'.join(l.strip() for l in linhas) + '\n' + body.strip() + '\n'
(raiz / 'publicar').mkdir(exist_ok=True)
(raiz / 'publicar' / 'index.html').write_text(saida, encoding='utf-8')
print('ok', len(saida))
