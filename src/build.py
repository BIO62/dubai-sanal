import json
t=open('src/page.html',encoding='utf8').read()
S=json.load(open('src/default-state.json',encoding='utf8'))
js=json.dumps(S,ensure_ascii=False).replace('<','\\u003c')
open('public/index.html','w',encoding='utf8').write(t.replace('__STATE__',js))
