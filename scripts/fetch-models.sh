#!/bin/sh
# Downloads self-hosted AI model files (not committed). Licenses: tessdata_fast Apache-2.0; U2-Net-p (rembg) Apache-2.0
set -e; mkdir -p "$(dirname "$0")/../models"; cd "$(dirname "$0")/../models"
mkdir -p tessdata
for l in eng spa fra deu por ita rus ara hin tam chi_sim jpn; do [ -s tessdata/$l.traineddata ] || curl -sfL -o tessdata/$l.traineddata https://github.com/tesseract-ocr/tessdata_fast/raw/main/$l.traineddata; done
ls -la tessdata
mkdir -p bg; [ -s bg/u2netp.onnx ] || curl -sfL -o bg/u2netp.onnx https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
