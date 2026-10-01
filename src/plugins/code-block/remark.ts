// Every code block is wrapped in <div class="code-block">, so client.ts has one
// place to put the copy button. A file name written after the language
// (```json:package.json, as on Qiita and Zenn) becomes a title bar above the
// code, and only the language goes on to syntax highlighting.
//
//   <div class="code-block">
//     <div class="code-block-title">package.json</div>   (when there is one)
//     <pre><code class="language-json">…</code></pre>
//   </div>
//
// Run it after plugins that turn code blocks into something else (mermaid).

// "json:package.json" → { lang: "json", title: "package.json" }. Only the first
// colon splits, so a file name may hold one too.
export function splitLang(lang: string | null | undefined): { lang: string | null; title: string } {
  if (!lang) return { lang: null, title: '' };
  const at = lang.indexOf(':');
  if (at < 0) return { lang, title: '' };
  return { lang: lang.slice(0, at) || null, title: lang.slice(at + 1) };
}

export default function remarkCodeBlock() {
  return (tree: any) => {
    const walk = (node: any) => {
      node.children?.forEach((child: any, i: number) => {
        if (child.type !== 'code') return walk(child);
        const { lang, title } = splitLang(child.lang);
        child.lang = lang;
        node.children[i] = {
          type: 'codeBlock',
          data: { hName: 'div', hProperties: { className: ['code-block'] } },
          children: [
            ...(title
              ? [{ type: 'codeBlockTitle', data: { hName: 'div', hProperties: { className: ['code-block-title'] } }, children: [{ type: 'text', value: title }] }]
              : []),
            child,
          ],
        };
      });
    };
    walk(tree);
  };
}
