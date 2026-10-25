#!/bin/bash
# back up /tmp language work into i18n-work/tmp/ (excluding scratch b.txt/o.txt)
D=/workspace/freepdf-site/i18n-work/tmp; mkdir -p $D/common
cp -f /tmp/val.py /tmp/eng2.py $D/common/ 2>/dev/null; cp -rf /tmp/fr/e2e /tmp/fr/e2e-l.tmp.js /tmp/fr/rtes.txt $D/common/ 2>/dev/null; cp -f /tmp/pt/ui.txt $D/common/ 2>/dev/null
for l in de id ar ru ja; do [ -d /tmp/$l ] && { mkdir -p $D/$l; (cd /tmp/$l && tar cf - --exclude=b.txt --exclude=o.txt --exclude="*.out" .) | tar xf - -C $D/$l; }; done
true
