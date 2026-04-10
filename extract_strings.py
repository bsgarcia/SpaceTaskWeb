import re
import os
import gzip

GAME_DIR = r'p:/CodeProjects/Current/SpaceTaskWithin/src/game'

for game in sorted(os.listdir(GAME_DIR)):
    fpath = os.path.join(GAME_DIR, game, 'Build', game + '.data')
    if not os.path.isfile(fpath):
        continue
    raw = open(fpath, 'rb').read()
    data = gzip.decompress(raw) if raw[:2] == b'\x1f\x8b' else raw
    hits = re.findall(rb'Within[A-Za-z0-9_]*', data)
    unique = list(dict.fromkeys(hits))  # preserve order, dedupe
    if unique:
        print(f'{game}: {[h.decode() for h in unique]}')
    else:
        print(f'{game}: not found')
