# Copies Hugo posts into sample/post (local only), converting their shortcodes
# to the new syntax, so a feature can be checked on real posts before the
# migration. The first cut of the migration converter.
#
# usage: python3 tools/hugo-to-sample.py content/post/<year>/<post>.md [...]
import os, re, shutil, sys

def attrs(s):
    return dict(re.findall(r'([\w-]+)="([^"]*)"', s))

def args(s):
    return re.findall(r'"([^"]*)"', s)

COLUMN = 680  # px; a width at least this wide changes nothing

def width_attr(a):
    w = a.get('width', '')
    return f'width={w}' if w.isdigit() and int(w) < COLUMN else ''

def directive(*attrs):
    attrs = ' '.join(a for a in attrs if a)
    return ':::img' + ('{' + attrs + '}' if attrs else '')

# An image with a width narrower than the column keeps it through :::img.
def wrap(a, image):
    w = width_attr(a)
    return f'{directive(w)}\n{image}\n:::' if w else image

def figure(m):
    a = attrs(m.group(1))
    cap = a.get('caption', '')
    title = f' "{cap}"' if cap else ''
    if 'src-dark' in a or 'src-light' in a:
        light = a.get('src-light', a.get('src'))
        dark = a.get('src-dark', a.get('src'))
        return (f'{directive("scheme=light", width_attr(a))}\n![{cap}]({light}{title})\n:::\n\n'
                f'{directive("scheme=dark", width_attr(a))}\n![{cap}]({dark}{title})\n:::')
    return wrap(a, f'![{cap}]({a["src"]}{title})')

def img(m):
    a = attrs(m.group(1))
    cap = a.get('caption', '')
    return wrap(a, f'![{cap}]({a["src"]}' + (f' "{cap}"' if cap else '') + ')')

RULES = [
    (r'\{\{<\s*figure(.*?)>\}\}', figure),
    (r'\{\{<\s*img(.*?)>\}\}', img),
    (r'\{\{[<%]\s*(?:hatena|link)\s+"([^"]+)"\s*[>%]\}\}', lambda m: m.group(1)),
    (r'\{\{<\s*twitter(.*?)>\}\}', lambda m: '::tweet{id=%s user=%s}' % (attrs(m.group(1))['id'], attrs(m.group(1))['user'])),
    (r'\{\{<\s*youtube\s+"([^"]+)"\s*>\}\}', lambda m: '::youtube{id=%s}' % m.group(1)),
    (r'\{\{<\s*spotify(.*?)>\}\}', lambda m: '::spotify{type=episode id=%s%s}' % (args(m.group(1))[0], ' theme=dark' if 'black' in args(m.group(1)) else '')),
    (r'\{\{<\s*slideshare(.*?)>\}\}', lambda m: (lambda a: '::slideshare{key=%s url="%s" title="%s" author="%s"}' % (a[0], a[1], a[2], a[3]))(args(m.group(1)))),
    (r'\{\{<\s*rawhtml\s*>\}\}\n?(.*?)\{\{<\s*/\s*rawhtml\s*>\}\}', lambda m: m.group(1).strip() + '\n'),
    # A raw <img> of a file in the post's folder: Astro serves those only for
    # Markdown images, so turn it into one (keeping its width).
    (r'^<img ([^>]*src="(?:\./)?[^"/:]+"[^>]*)/?>[ \t]*$', lambda m: wrap(attrs(m.group(1)), '![%s](%s)' % (attrs(m.group(1)).get('alt', ''), attrs(m.group(1))['src']))),
]

for src in sys.argv[1:]:
    text = open(src).read()
    for pattern, fn in RULES:
        text = re.sub(pattern, fn, text, flags=re.S | re.M)
    left = re.findall(r'\{\{[<%].*', text)
    year = src.split('/')[2]
    bundle = os.path.basename(src) == 'index.md'
    slug = os.path.basename(os.path.dirname(src)) if bundle else os.path.basename(src)[:-3]
    dst = f'sample/post/{year}/{slug}'
    os.makedirs(dst, exist_ok=True)
    open(f'{dst}/index.md', 'w').write(text)
    if bundle:
        for f in os.listdir(os.path.dirname(src)):
            p = os.path.join(os.path.dirname(src), f)
            if f != 'index.md':
                (shutil.copytree if os.path.isdir(p) else shutil.copy)(p, os.path.join(dst, f))
    print(dst, 'LEFT:' if left else 'ok', left or '')
