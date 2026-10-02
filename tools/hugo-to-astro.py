# Converts the Hugo posts in content/post to the Astro site's format, in
# place. A one-time migration; kept in the repository as the record of how
# the posts were changed. Run it on a clean work tree, then review the diff.
#
#   python3 tools/hugo-to-astro.py
#
# - Single-file posts (content/post/<year>/<slug>.md) become bundles
#   (content/post/<year>/<slug>/index.md, moved with git mv), so every post
#   has its own folder. The URL keeps the slug.
# - Front matter keeps title, date, description, draft (as it is), toc and tags,
#   in that order, and adds hidden; a key that is missing or empty gets the
#   schema's default. Hugo-only keys (categories, author, oldlink, image) go.
# - Shortcodes become the new syntax (CLAUDE.md, "Writing posts"). Anything
#   left over is reported, and the run fails.
import fnmatch, os, re, subprocess, sys

ROOT = 'content/post'
COLUMN = 680  # px; an image at least this wide is shown at the column width anyway
IMAGE = re.compile(r'\.(png|jpe?g|gif|svg|webp)$', re.I)

# --- shortcode attributes ---------------------------------------------------

def attrs(s):
    # key="value" with \" escapes inside the value
    return {k: v.replace('\\"', '"') for k, v in re.findall(r'([\w-]+)="((?:\\.|[^"\\])*)"', s)}

def args(s):
    return re.findall(r'"([^"]*)"', s)

# Captions were Markdown (Hugo's markdownify); an image title is plain text
def plain(s):
    s = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', s)  # [text](url) -> text
    s = re.sub(r'<(https?://[^>]+)>', r'\1', s)  # <url> -> url
    s = s.strip().strip('"').strip()
    return s.replace('"', '”')  # a " would end the Markdown title

# --- images -----------------------------------------------------------------

def width_attr(a):
    w = a.get('width', '')
    return f'width={w}' if w.isdigit() and int(w) < COLUMN else ''

def directive(*xs):
    xs = ' '.join(x for x in xs if x)
    return ':::img' + ('{' + xs + '}' if xs else '')

def image(src, caption, link=''):
    title = f' "{caption}"' if caption else ''
    md = f'![{caption}]({src}{title})'
    return f'[{md}]({link})' if link else md

# An image narrower than the column keeps its width through :::img
def block(a, md, *extra):
    w = width_attr(a)
    if w or extra:
        return f'{directive(*extra, w)}\n{md}\n:::'
    return md

def figure(m):
    a = attrs(m.group(1))
    cap = plain(a.get('caption', ''))
    link = a.get('link', '')
    if 'src-dark' in a or 'src-light' in a:
        light = a.get('src-light', a.get('src'))
        dark = a.get('src-dark', a.get('src'))
        return (block(a, image(light, cap, link), 'scheme=light') + '\n\n' +
                block(a, image(dark, cap, link), 'scheme=dark'))
    return block(a, image(a['src'], cap, link))

# --- galleries and carousels -------------------------------------------------

def gallery(post_dir):
    def convert(m):
        a = attrs(m.group(1))
        a.update(dict(re.findall(r'([\w-]+)=(\w+)', m.group(1))))  # unquoted values too
        files = []
        for top, _, names in os.walk(post_dir):
            for n in names:
                rel = os.path.relpath(os.path.join(top, n), post_dir)
                # Hugo's Resources.Match: case-insensitive, * stays within a folder
                if IMAGE.search(n) and fnmatch.fnmatch(rel.lower(), a['match'].lower()) and \
                        rel.count('/') == a['match'].count('/'):
                    files.append(rel)
        if not files:
            raise SystemExit(f'{post_dir}: gallery match="{a["match"]}" finds no images')
        files.sort(key=str.lower, reverse=a.get('sortOrder') == 'desc')
        opts = []
        if a.get('rowHeight', '150') != '150':
            opts.append(f'rowHeight={a["rowHeight"]}')
        if a.get('margins', '5') != '5':
            opts.append(f'gap={a["margins"]}')
        head = ':::gallery' + ('{' + ' '.join(opts) + '}' if opts else '')
        return head + '\n' + '\n'.join(f'![]({f})' for f in files) + '\n:::'
    return convert

def carousel(m):
    a = attrs(m.group(1))
    opts = []
    if a.get('interval', '7000') != '7000':
        opts.append(f'interval={a["interval"]}')
    if a.get('aspectRatio', '16/9') != '16/9':
        opts.append(f'ratio={a["aspectRatio"]}')
    if a.get('autoplay', 'true') != 'true':
        opts.append('autoplay=false')
    head = ':::carousel' + ('{' + ' '.join(opts) + '}' if opts else '')
    images = [s.strip() for s in a['images'].split(',') if s.strip()]
    return head + '\n' + '\n'.join(f'![]({s})' for s in images) + '\n:::'

# --- the rules ----------------------------------------------------------------

def rules(post_dir):
    return [
        (r'\{\{<\s*figure(.*?)>\}\}', figure),
        (r'\{\{<\s*img(.*?)>\}\}', figure),  # the same attributes
        (r'\{\{<\s*gallery(.*?)>\}\}', gallery(post_dir)),
        (r'\{\{<\s*carousel(.*?)>\}\}', carousel),
        # a link card: a URL alone in its paragraph
        (r'[ \t]*\{\{[<%]\s*(?:hatena|link)\s+"([^"]+)"\s*[>%]\}\}[ \t]*', lambda m: f'\n\n{m.group(1)}\n\n'),
        (r'\{\{<\s*twitter(.*?)>\}\}', lambda m: '::tweet{id=%s user=%s}' % (attrs(m.group(1))['id'], attrs(m.group(1))['user'])),
        (r'\{\{<\s*youtube\s+"([^"]+)"\s*>\}\}', lambda m: '::youtube{id=%s}' % m.group(1)),
        (r'\{\{<\s*spotify(.*?)>\}\}', lambda m: '::spotify{type=episode id=%s%s}' % (args(m.group(1))[0], ' theme=dark' if 'black' in args(m.group(1)) else '')),
        (r'\{\{<\s*slideshare(.*?)>\}\}', lambda m: (lambda a: '::slideshare{key=%s url="%s" title="%s" author="%s"}' % (a[0], a[1], a[2], a[3]))(args(m.group(1)))),
        (r'\{\{<\s*rawhtml\s*>\}\}\n?(.*?)\{\{<\s*/\s*rawhtml\s*>\}\}', lambda m: m.group(1).strip() + '\n'),
        # A raw <img> of a file in the post's folder: Astro serves those only
        # for Markdown images, so turn it into one (keeping its width).
        (r'^<img ([^>]*src="(?:\./)?[^"/:]+"[^>]*)/?>[ \t]*$', lambda m: block(attrs(m.group(1)), image(attrs(m.group(1))['src'], attrs(m.group(1)).get('alt', '')))),
    ]

# --- front matter ---------------------------------------------------------------

# Every key of the schema (src/content.config.ts) but slug, in this order, and
# the value a missing one gets (title and date must be there)
KEYS = ('title', 'date', 'description', 'draft', 'hidden', 'toc', 'tags')
DEFAULTS = {'description': 'description: ""', 'draft': 'draft: false', 'hidden': 'hidden: false', 'toc': 'toc: false', 'tags': 'tags: []'}

def front_matter(text):
    m = re.match(r'---\n(.*?)\n---\n', text, re.S)
    if not m:
        raise SystemExit('no front matter')
    blocks = []  # (key, lines)
    for line in m.group(1).split('\n'):
        if not line.strip():
            continue
        key = re.match(r'([A-Za-z_]+):', line)
        if key:
            blocks.append((key.group(1), [line]))
        elif blocks:
            blocks[-1][1].append(line)  # a continuation (a YAML list item)
    kept = {}
    for key, lines in blocks:
        value = lines[0].split(':', 1)[1].strip()
        empty = value in ('', '""', "''", '[]') and len(lines) == 1
        if key in KEYS and not empty:
            kept[key] = lines
    out = []
    for key in KEYS:
        out += kept.get(key) or [DEFAULTS[key]]
    return '---\n' + '\n'.join(out) + '\n---\n' + text[m.end():]

# --- run ---------------------------------------------------------------------------

def git(*a):
    subprocess.run(['git', *a], check=True)

def convert(path, post_dir):
    text = front_matter(open(path).read())
    for pattern, fn in rules(post_dir):
        text = re.sub(pattern, fn, text, flags=re.S | re.M)
    text = re.sub(r'\n{3,}', '\n\n', text)  # blank lines the rules left
    open(path, 'w').write(text)
    return re.findall(r'\{\{[<%].*', text)

failed = False
for year in sorted(os.listdir(ROOT)):
    for name in sorted(os.listdir(os.path.join(ROOT, year))):
        p = os.path.join(ROOT, year, name)
        if name.endswith('.md'):  # a single-file post: make it a bundle
            post_dir = p[:-3]
            os.makedirs(post_dir)
            git('mv', p, os.path.join(post_dir, 'index.md'))
        elif os.path.exists(os.path.join(p, 'index.md')):
            post_dir = p
        else:
            continue  # an .mdx post: already in the new format
        left = convert(os.path.join(post_dir, 'index.md'), post_dir)
        print(post_dir, 'LEFT: ' + ' | '.join(left) if left else 'ok')
        failed |= bool(left)

sys.exit(1 if failed else 0)
