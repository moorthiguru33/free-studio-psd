#!/bin/sh
# Downloads self-hosted AI model files (not committed). Licenses: tessdata_fast Apache-2.0
set -e; cd "$(dirname "$0")/../models"
mkdir -p tessdata
for l in eng spa fra deu por ita rus ara hin tam chi_sim jpn; do [ -s tessdata/$l.traineddata ] || curl -sfL -o tessdata/$l.traineddata https://github.com/tesseract-ocr/tessdata_fast/raw/main/$l.traineddata; done
ls -la tessdata
