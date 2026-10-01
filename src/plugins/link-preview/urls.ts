// Which URLs of a Markdown tree become preview cards: a paragraph that holds
// nothing but a URL (an autolink with GFM, or plain text without), at the top
// level only, so URLs in lists and quotes stay links. Shared by the remark
// plugin and the cache pruning (tools/prune-link-previews.ts), so the two
// always agree. No imports, so a plain Node script can load it.

export function bareUrl(node: any): string | undefined {
  if (node.type !== 'paragraph' || node.children.length !== 1) return;
  const [child] = node.children;
  if (child.type === 'text') {
    const value = child.value.trim();
    return /^https?:\/\/\S+$/.test(value) ? value : undefined;
  }
  if (child.type === 'link' && /^https?:\/\//.test(child.url)) {
    const label = child.children.length === 1 && child.children[0].type === 'text' ? child.children[0].value : '';
    return label === child.url ? child.url : undefined;
  }
}

/** the card URLs of a tree, in order */
export function previewUrls(tree: any): string[] {
  return tree.children.map(bareUrl).filter((url: string | undefined): url is string => Boolean(url));
}
