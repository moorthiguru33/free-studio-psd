#!/bin/sh
# Image/media samples for e2e tests (needs python3 + pillow, pillow-heif in /tmp/hv venv, ffmpeg)
set -e; cd "$(dirname "$0")/samples"
cp ../../node_modules/@vladmandic/face-api/demo/sample1.jpg face.jpg
PY=${PY:-/tmp/hv/bin/python}
$PY - <<'P'
from PIL import Image,ImageDraw
import pillow_heif;pillow_heif.register_heif_opener()
im=Image.open('face.jpg').convert('RGB');im.save('photo.heic',quality=80);im.save('photo.webp',quality=85);sm=im.resize((480,im.height*480//im.width));sm.save('photo.tiff',compression='tiff_lzw');sm.save('photo.bmp')
lg=Image.new('RGBA',(300,300),(0,0,0,0));d=ImageDraw.Draw(lg);d.ellipse((20,20,280,280),fill=(229,50,45,255));d.rectangle((110,80,190,220),fill=(255,255,255,255));lg.save('logo.png')
P
ffmpeg -y -loglevel error -f lavfi -i testsrc=size=320x240:rate=25 -f lavfi -i sine=frequency=440:sample_rate=44100 -t 6 -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 128k -shortest clip.mp4
ffmpeg -y -loglevel error -f lavfi -i sine=frequency=330:sample_rate=44100 -t 8 -ac 2 tone.wav
ffmpeg -y -loglevel error -i tone.wav -c:a libmp3lame -b:a 192k tone.mp3
ffmpeg -y -loglevel error -f lavfi -i testsrc=size=160x120:rate=10 -t 2 anim.gif
