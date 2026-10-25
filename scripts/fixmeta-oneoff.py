import json,re
bad=json.load(open('/tmp/bad.json'));tools=json.load(open('src/tools.json'))
tools=tools if isinstance(tools,list) else tools['tools']
import glob
for g in glob.glob('src/tools.d/*.json'):
  x=json.load(open(g));tools+=x if isinstance(x,list) else x.get('tools',[])
bys={t['slug']:t['id'] for t in tools}
out={"tools":{}};left=[]
def ft(t):
  if len(t)<=60:return t
  t2=t.replace(' | Fileopia','')
  if len(t2)<=60:return t2
  parts=t2.split(' – ')
  while len(' – '.join(parts))>60 and len(parts)>1:parts.pop()
  r=' – '.join(parts);return r if len(r)<=60 else None
def fd(d):
  if len(d)<=155:return d
  ss=re.split(r'(?<=[.!?])\s+',d)
  while len(' '.join(ss))>155 and len(ss)>1:ss.pop()
  r=' '.join(ss);return r if 70<=len(r)<=155 else None
for u,lt,ld,t,d in bad:
  if u not in bys:left.append((u,t,d));continue
  e={};T=ft(t);D=fd(d)
  if lt>60:
    if T:e['title']=T
    else:left.append((u,'T',t))
  if ld>155:
    if D:e['desc']=D
    else:left.append((u,'D',d))
  if e:out['tools'][bys[u]]={"seo":e}
json.dump(out,open('src/i18n/en/zzz-meta.json','w'),ensure_ascii=False,indent=1)
print(len(out['tools']));[print(x) for x in left]
M={
'what-is-my-ip':'See your public IPv4 and IPv6 address, user agent, browser, OS, screen size, language and time zone – everything your browser shares with sites.',
'json-formatter':'Format, beautify, minify and validate JSON instantly. Shows the exact line and column of errors and runs in your browser, so API data stays private.',
'keyword-density-checker':'Check keyword density for words and 2–3 word phrases, test a target keyword, filter stop words and spot over-optimisation. Free, private, no limit.',
'printable-calendar-maker':'Make a printable calendar PDF for any year or month: A4 or Letter, Monday or Sunday start, week numbers, notes, your own events and colours. Free.',
'robots-txt-generator':'Create a valid robots.txt: allow or block crawlers, disallow folders, block AI bots like GPTBot, add your sitemap and test URLs against the rules.',
'instagram-grid-maker':'Split one photo into a 3×3, 3×2 or 3×4 Instagram grid with 4:5 tiles, numbered in posting order, downloaded as a ZIP. Free, no app, no upload.',
'text-to-speech':'Paste text and hear it read aloud with natural voices in dozens of languages. Adjust speed and pitch, follow word highlighting. Free, unlimited.',
'video-merger':'Combine video clips into one MP4 or WebM in your browser. Pick size, frame rate and fit – including vertical 1080×1920 for Reels. No upload, no watermark.',
'to-do-list':'A fast, private online to-do list: priorities, due dates, filters and sorting, export to Markdown, text or CSV. Saved in your browser – no account.',
'age-calculator':'Calculate exact age in years, months and days from a date of birth, plus total weeks and days, your birth weekday and a next-birthday countdown.',
'password-strength-checker':'Test how strong your password is: detects common passwords, words, patterns and dates, estimates crack time and suggests fixes. 100% in your browser.',
'spin-the-wheel':'Type your choices and spin a colourful wheel to pick a random winner. Remove winners, set spin time, go full screen. Free, secure randomness, offline.',
'date-difference-calculator':'Calculate days, weeks, months and years between two dates, count working days excluding weekends and holidays, and add or subtract days.',
'percentage-calculator':'Free percentage calculator: X% of Y, what percent X is of Y, percentage change, increase or decrease by a percent, reverse percentages and points.',
}
for k,v in M.items():
  assert len(v)<=155,(k,len(v))
  out['tools'].setdefault(bys[k],{"seo":{}})['seo']['desc']=v
json.dump(out,open('src/i18n/en/zzz-meta.json','w'),ensure_ascii=False,indent=1)
