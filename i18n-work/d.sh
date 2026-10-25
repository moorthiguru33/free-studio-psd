cd /tmp/es/src; for i in "$@"; do python3 -c "
import json;d=json.load(open('$i.json'));d['seo'].pop('related',0);d['seo'].pop('updated',0);c=d['seo'].pop('compare',[]);d['seo'].pop('compareCols',0);print('##$i');print(json.dumps(d,ensure_ascii=False));print(c[4:])"; done
