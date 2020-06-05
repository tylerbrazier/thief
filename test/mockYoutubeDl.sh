#!/bin/bash
set -e

# in .env set YOUTUBE_DL_EXE=/path/to/test/mockYoutubeDl.sh

echo 'starting'
for i in 1 2 3 4 5; do
  echo "output $i"
  sleep 2s
done
echo 'done'
