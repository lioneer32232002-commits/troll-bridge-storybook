#!/bin/sh
# usage: grab.sh NN
N="$1"
D="C:/Users/User/Downloads"
F=$(ls -t "$D"/Gemini_Generated_Image_*.jpg 2>/dev/null | head -1)
if [ -z "$F" ]; then echo "NO_FILE"; exit 1; fi
DEST="D:/繪本/site/img/p$N.jpg"
mv "$F" "$DEST" || exit 1
python -c "
from PIL import Image
import sys,os
p=r'$DEST'
im=Image.open(p)
print('p$N', im.size, os.path.getsize(p))
"
