// The opening of a post as plain text, for <meta name="description"> and the
// feed when the front matter has no description. Works on the Markdown source:
// only prose paragraphs count; code, directives, embeds, images and HTML do not.

const MAX = 120;

export function excerpt(markdown: string, max = MAX): string {
  const text = markdown
    // fenced code (``` and ~~~) and :::directive blocks, with their contents
    .replace(/^(\s*)(```|~~~)[^\n]*\n[\s\S]*?^\1\2\s*$/gm, '\n')
    .replace(/^:::[\s\S]*?^:::\s*$/gm, '\n')
    // MDX imports and exports, front matter left over, leaf directives (::tweet{...})
    .replace(/^(import|export)\s.*$/gm, '')
    .replace(/^::\w.*$/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    // prose only: not HTML or JSX blocks (embeds, figures), headings, tables,
    // quotes, rules, footnotes, a lone URL or image
    .filter((block) => block && !/^(<|#|\||>|---|\*\*\*|\[\^|https?:\/\/\S+$|!\[)/.test(block))
    .map((block) =>
      block
        .replace(/<[^>\n]+>/g, '') // inline tags; their text stays
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) -> text
        .replace(/\[\^[^\]]+\]/g, '') // footnote references
        .replace(/`([^`]*)`/g, '$1')
        .replace(/(\*\*|__|\*|_|~~)(\S(?:.*?\S)?)\1/g, '$2')
        .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '') // list markers
        .replace(/\s*\n\s*/g, ' ')
        .trim(),
    )
    .filter(Boolean)
    .join(' ');
  const chars = [...text];
  return chars.length > max ? chars.slice(0, max).join('').trimEnd() + '…' : text;
}
