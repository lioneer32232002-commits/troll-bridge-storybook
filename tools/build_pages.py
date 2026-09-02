"""pages.json → site/pages.js（去掉 prompt）。改完 pages.json 跑一次。"""
import json, io, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
d = json.load(io.open(root / 'pages.json', encoding='utf-8'))
pages = [{k: v for k, v in p.items() if k != 'prompt'} for p in d['pages']]
s = json.dumps({'title': d['title'], 'pages': pages}, ensure_ascii=False, indent=1)
io.open(root / 'site' / 'pages.js', 'w', encoding='utf-8').write('// 由 pages.json 自動產生，請勿手改\nwindow.BOOK = ' + s + ';\n')
print('site/pages.js updated')
