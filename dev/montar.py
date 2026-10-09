# Monta a versão de testes em dist/: só os arquivos do jogo, mais um .zip pronto pra subir.
import pathlib, re, shutil, zipfile
raiz = pathlib.Path(__file__).resolve().parent.parent
versao = re.search(r"versao:\s*'([^']+)'", (raiz / 'js/config.js').read_text(encoding='utf-8')).group(1)
destino = raiz / 'dist' / 'site'
if destino.exists():
    shutil.rmtree(destino)
destino.mkdir(parents=True)
itens = ['index.html', 'manifest.webmanifest', 'css', 'js', 'assets/jogo']
for i in itens:
    o = raiz / i
    d = destino / i
    if o.is_dir():
        shutil.copytree(o, d)
    else:
        d.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(o, d)
nome_zip = raiz / 'dist' / f'chorumaca-v{versao}-teste.zip'
with zipfile.ZipFile(nome_zip, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in sorted(destino.rglob('*')):
        if f.is_file():
            z.write(f, f.relative_to(destino).as_posix())
total = sum(f.stat().st_size for f in destino.rglob('*') if f.is_file())
print(f'pasta: {destino}  ({total/1024:.0f} KB)')
print(f'zip:   {nome_zip}  ({nome_zip.stat().st_size/1024:.0f} KB)')
