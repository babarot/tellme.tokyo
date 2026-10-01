# Makes the dark-background logo from src/icons/logo.svg: same pixels and hues,
# with OKLab lightness compressed into [LO, HI] so dark pixels stay visible on
# a dark background while light/dark order (the shading) is kept.
#
# Writes:
#   src/icons/logo-dark.svg  header logo for dark mode
#   public/favicon.svg       both versions, switched by prefers-color-scheme
#
# Run: python3 tools/logo-dark.py [LO] [HI]   (defaults 0.35 0.9)
import re, sys

LO = float(sys.argv[1]) if len(sys.argv) > 1 else 0.35
HI = float(sys.argv[2]) if len(sys.argv) > 2 else 0.9

def srgb_to_lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def lin_to_srgb(c):
    c = max(0.0, min(1.0, c))
    c = 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
    return round(c * 255)

def to_oklab(r, g, b):
    r, g, b = map(srgb_to_lin, (r, g, b))
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = (x ** (1 / 3) for x in (l, m, s))
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)

def from_oklab(L, a, b):
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return tuple(map(lin_to_srgb, (
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)))

def lighten(hexcolor):
    r, g, b = (int(hexcolor[i:i + 2], 16) for i in (1, 3, 5))
    L, a, bb = to_oklab(r, g, b)
    return '#%02x%02x%02x' % from_oklab(LO + (HI - LO) * L, a, bb)

src = open('src/icons/logo.svg').read()
dark = re.sub(r'fill="(#[0-9a-f]{6})"', lambda m: f'fill="{lighten(m.group(1))}"', src)
dark = dark.replace('<!-- Tokyo Tower pixel art', '<!-- Dark-background variant of logo.svg, made by tools/logo-dark.py. Tokyo Tower pixel art', 1)
open('src/icons/logo-dark.svg', 'w').write(dark)

rects = lambda svg: '\n'.join('    ' + r for r in re.findall(r'<rect[^>]*/>', svg))
favicon = f'''<!-- Made by tools/logo-dark.py: logo.svg, and its dark variant under prefers-color-scheme: dark -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <style>
    .on-dark {{ display: none; }}
    @media (prefers-color-scheme: dark) {{
      .on-light {{ display: none; }}
      .on-dark {{ display: inline; }}
    }}
  </style>
  <g class="on-light">
{rects(src)}
  </g>
  <g class="on-dark">
{rects(dark)}
  </g>
</svg>
'''
open('public/favicon.svg', 'w').write(favicon)
