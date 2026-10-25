import sys,re,html
for p in sys.argv[1:]:
    s=open(p,encoding='utf-8').read();b=re.search(r'<body[^>]*>(.*)</body>',s,re.S).group(1)
    b=re.sub(r'<(script|style|template)[^>]*>.*?</\1>','',b,flags=re.S)
    print(p.split('dist/')[-1].split('/')[0],len(html.unescape(re.sub(r'<[^>]+>',' ',b)).split()))
