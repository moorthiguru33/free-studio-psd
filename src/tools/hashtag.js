// Hashtag generator: builds tags from your own words (single, combined, plural) plus curated niche sets, with platform limits. Offline – no trend data is claimed.
const HTS={travel:'travel travelgram wanderlust instatravel travelphotography traveltheworld explore adventure vacation roadtrip travelblogger backpacking holiday travelling worldtraveler',
 food:'food foodie foodporn instafood foodphotography yummy delicious homecooking foodlover foodstagram recipe healthyfood dinner tasty eatlocal',
 fitness:'fitness gym workout fitnessmotivation fit training health bodybuilding fitfam exercise personaltrainer strong cardio homeworkout healthylifestyle',
 fashion:'fashion style ootd outfitoftheday fashionblogger streetstyle instafashion fashionista styleinspo lookbook outfit menswear womensfashion vintage trend',
 photography:'photography photooftheday photographer naturephotography portrait streetphotography landscape canon nikon sonyalpha picoftheday instaphoto goldenhour shotoniphone light',
 business:'business entrepreneur smallbusiness marketing success startup motivation leadership branding businessowner digitalmarketing growth sidehustle mindset networking',
 tech:'technology tech innovation programming coding developer software ai machinelearning gadgets startup webdevelopment javascript python cybersecurity',
 music:'music musician newmusic singer songwriter hiphop guitar producer livemusic rap musicproducer indie spotify beats band',
 art:'art artist artwork drawing painting illustration sketch digitalart artoftheday contemporaryart watercolor creative design artistsoninstagram sketchbook',
 pets:'pets dogsofinstagram catsofinstagram dog cat puppy petstagram doglover catlover cute animals instadog instacat rescuedog adoptdontshop',
 nature:'nature naturelovers landscape outdoors hiking mountains sunset beach forest wildlife earth sky flowers green naturephotography',
 beauty:'beauty makeup skincare mua makeuptutorial selfcare beautyblogger glam lipstick skincareroutine hair nails cosmetics makeupartist natural',
 gaming:'gaming gamer videogames ps5 xbox pcgaming nintendo twitch streamer esports gamingcommunity fortnite minecraft retrogaming gamingsetup',
 wedding:'wedding bride weddingday love weddingphotography bridal weddinginspiration engaged weddingdress groom justmarried weddingplanner ceremony celebration forever',
 education:'education learning students study teacher school knowledge studygram motivation onlinelearning university edtech books science careers',
 home:'homedecor interiordesign home decor interior design homesweethome diy livingroom homestyle cozy minimalism plants renovation architecture',
 parenting:'parenting momlife dadlife family kids motherhood toddler baby momblogger familytime parenthood newborn kidsactivities homeschool love'};
TOOLS.hashtag={live:true,noAdv:true,goLabel:()=>T.download,
 opts:()=>`<label>Describe your post (topic, keywords or caption)<textarea id="htin" rows="4">Sunset hike in the mountains with my dog</textarea></label>`+sel('htniche','Niche (adds a curated set)',[['auto','Detect from my words'],...Object.keys(HTS).map(k=>[k,k[0].toUpperCase()+k.slice(1)]),['none','None – only my words']])+sel('htplat','Platform',[['ig','Instagram (up to 30, 8–15 recommended)'],['tt','TikTok (3–6)'],['x','X / Twitter (1–2)'],['li','LinkedIn (3–5)'],['yt','YouTube (up to 15)']])+sel('htcase','Format',[['lower','#lowercase'],['camel','#CamelCase (more readable, screen-reader friendly)']]),
 setup(){const el=document.createElement('div');el.innerHTML='<p id="htout" style="font-size:1.1em;line-height:1.9;word-spacing:.2em"></p><p style="text-align:center"><button type="button" class="btn" id="htcopy">📋 Copy hashtags</button></p><p class="hint" id="htinfo"></p>';$('#htcopy',el).onclick=()=>navigator.clipboard?.writeText($('#htout',work).textContent);return el;},
 run(){const raw=v('htin')||'';const stop=new Set('a an the and or of in on at to for with my our your is are was be this that it its from by me we you i so very just'.split(' '));const words=raw.toLowerCase().replace(/#/g,' ').match(/[\p{L}\p{N}]+/gu)?.filter(w=>w.length>2&&!stop.has(w))||[];
  if(!words.length&&v('htniche')==='none')throw Object.assign(new Error('Type a few words about your post'),{soft:true});
  const lim={ig:30,tt:6,x:2,li:5,yt:15}[v('htplat')];const camel=v('htcase')==='camel';let niche=v('htniche');
  if(niche==='auto'){let best=null,bs=0;for(const [k,s] of Object.entries(HTS)){const set=s.split(' ');const sc=words.filter(w=>set.some(t=>t.includes(w)||w.includes(t.replace(/s$/,'')))).length+(words.includes(k)?2:0);if(sc>bs){bs=sc;best=k;}}niche=best;}
  const own=[];const add=t=>{t=t.replace(/[^\p{L}\p{N}]/gu,'');if(t.length>1&&t.length<=30&&!own.some(x=>x.toLowerCase()===t.toLowerCase()))own.push(t);};const cap=w=>w[0].toUpperCase()+w.slice(1);
  words.forEach(w=>add(camel?cap(w):w));for(let i=0;i+1<words.length;i++)add(camel?cap(words[i])+cap(words[i+1]):words[i]+words[i+1]);
  const cur=niche&&niche!=='none'?HTS[niche].split(' '):[];const mix=[];let a=0,b=0;const ownN=Math.ceil(lim*.5);while(mix.length<lim&&(a<own.length||b<cur.length)){if(a<own.length&&(mix.length<ownN||b>=cur.length))mix.push(own[a++]);else if(b<cur.length){const t=cur[b++];if(!mix.some(x=>x.toLowerCase()===t))mix.push(camel?t.replace(/^./,c=>c.toUpperCase()):t);}}
  const tags=mix.slice(0,lim).map(t=>'#'+t);$('#htout',work).textContent=tags.join(' ');$('#htinfo',work).textContent=`${tags.length} hashtags${niche&&niche!=='none'?' · niche: '+niche:''}. Generated offline from your words and a curated list – check a tag on the platform before relying on it, and skip any that do not describe your post.`;
  return {blob:new Blob([tags.join(' ')+'\n'],{type:'text/plain'}),name:'hashtags.txt',info:tags.length+' hashtags'};}};
