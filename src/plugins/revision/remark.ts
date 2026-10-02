// Updates to an old post that keep what it said when it was published.
//
//   :::addendum{date=2026-10-02}      a note added later; the text around it
//   ...                               stays as it was
//   :::
//
//   ::::revisions                     a rewritten part, newest version first;
//   :::version{date=2026-10-02}       the first is the current one, the others
//   ...                               fold away under <details>
//   :::
//   :::version{date=2026-02-09}
//   ...
//   :::
//   ::::
//
//   ::::revisions{view=tabs}          the versions as tabs instead, switched
//                                     by CSS alone (radio inputs, no script)
//
// Each version is named once: the current one in the label above it (details)
// or in its tab, the past ones in their summaries or tabs. A version is
// "rewritten" on its date, except the oldest, which is the original text.
//
// A directive inside another needs fewer colons than the one around it
// (:::::revisions > ::::version > :::gallery); otherwise the inner closing
// fence closes the outer one too. The stray fence left behind fails the build.
//
// Headings inside past versions get ids of their own ("was-<date>-<n>"), so
// they never collide with the current version's. Two values go to the page
// through the front matter (Astro's remarkPluginFrontmatter):
//
//   revisionHiddenHeadings  ids of those headings, to leave out of a table of
//                           contents
//   updated                 the newest date of an addendum or a current
//                           version (YYYY-MM-DD)
//
// In the tabs view each version carries data-shown-by="<id of its radio>",
// which the table of contents uses to bring a hidden heading into view.
// Needs remark-directive before it.
import { element } from '../shared/directive';

export type RevisionLabels = {
  /** label of an addendum; {date} is replaced by its date */
  addendum?: string;
  /** a version that rewrote the one before it, on {date} */
  rewritten?: string;
  /** the oldest version: the text as first written ({date} may be used too) */
  original?: string;
  /** accessible name of the group of tabs */
  tabs?: string;
};

export type RevisionOptions = { labels?: RevisionLabels };

const DEFAULT_LABELS: Required<RevisionLabels> = {
  addendum: 'Added {date}',
  rewritten: 'Rewritten {date}',
  original: 'Original',
  tabs: 'Versions',
};

/** the most versions the tabs view has CSS for (style.css) */
export const MAX_TABS = 5;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const VIEWS = new Set(['details', 'tabs']);
const STRAY_FENCE = /(^|\n)\s*:{3,}\s*($|\n)/;

function descendants(node: any, type: string, out: any[] = []): any[] {
  for (const child of node.children ?? []) {
    if (child.type === type) out.push(child);
    descendants(child, type, out);
  }
  return out;
}

// A label as mdast: the template's text with <time> for {date}.
function label(template: string, date: string) {
  const [before, ...rest] = template.split('{date}');
  const out: any[] = before ? [{ type: 'text', value: before }] : [];
  for (const after of rest) {
    out.push(element('time', { dateTime: date }, [{ type: 'text', value: date }]));
    if (after) out.push({ type: 'text', value: after });
  }
  return out;
}

export default function remarkRevision({ labels: given = {} }: RevisionOptions = {}) {
  const labels = { ...DEFAULT_LABELS, ...given };

  return (tree: any, file: any) => {
    const where = (node: any) => `${file.path ?? 'post'}:${node.position?.start.line ?? '?'}`;
    const hidden: string[] = [];
    const dates: string[] = [];
    let blocks = 0;

    const dateOf = (node: any) => {
      const date = node.attributes?.date;
      if (date === undefined) throw new Error(`${where(node)}: :::${node.name} needs a date (date=YYYY-MM-DD)`);
      if (!DATE.test(date)) throw new Error(`${where(node)}: :::${node.name} date must be YYYY-MM-DD, got "${date}"`);
      return date;
    };

    const addendum = (node: any) => {
      const date = dateOf(node);
      dates.push(date);
      return element('aside', { className: ['addendum'] }, [
        element('p', { className: ['addendum-label'] }, label(labels.addendum, date)),
        ...node.children,
      ]);
    };

    const revisions = (node: any) => {
      const view = node.attributes?.view ?? 'details';
      if (!VIEWS.has(view)) throw new Error(`${where(node)}: ::::${node.name} view must be details or tabs, got "${view}"`);

      for (const child of node.children) {
        if (child.type !== 'containerDirective' || child.name !== 'version') {
          throw new Error(`${where(child)}: ::::${node.name} holds only :::version blocks`);
        }
      }
      const versions = node.children.map((v: any) => ({ node: v, date: dateOf(v) }));
      if (versions.length < 2) throw new Error(`${where(node)}: ::::${node.name} needs at least two :::version blocks, found ${versions.length}`);
      if (view === 'tabs' && versions.length > MAX_TABS) {
        throw new Error(`${where(node)}: ::::${node.name}{view=tabs} holds at most ${MAX_TABS} versions, found ${versions.length}`);
      }
      for (let i = 1; i < versions.length; i++) {
        if (versions[i].date > versions[i - 1].date) {
          throw new Error(`${where(versions[i].node)}: :::version blocks go newest first; ${versions[i].date} comes after ${versions[i - 1].date}`);
        }
      }
      dates.push(versions[0].date);

      for (const { node: v, date } of versions.slice(1)) {
        for (const heading of descendants(v, 'heading')) {
          const id = `was-${date}-${hidden.length + 1}`;
          heading.data = { ...heading.data, hProperties: { ...heading.data?.hProperties, id } };
          hidden.push(id);
        }
      }

      const n = ++blocks;
      const name = (i: number) => label(i === versions.length - 1 ? labels.original : labels.rewritten, versions[i].date);
      if (view === 'details') {
        const [current, ...past] = versions;
        return element('div', { className: ['revisions'], dataView: 'details' }, [
          element('section', { className: ['revision'], dataCurrent: true }, [
            element('p', { className: ['revision-label'] }, name(0)),
            ...current.node.children,
          ]),
          ...past.map(({ node: v }: any, i: number) =>
            element('details', { className: ['revision'] }, [
              element('summary', { className: ['revision-label'] }, name(i + 1)),
              ...v.children,
            ]),
          ),
        ]);
      }

      const id = (i: number) => `revision-${n}-${i}`;
      return element('div', { className: ['revisions'], dataView: 'tabs' }, [
        element(
          'div',
          { className: ['revision-tabs'], role: 'radiogroup', ariaLabel: labels.tabs },
          versions.flatMap((_: any, i: number) => [
            element('input', { type: 'radio', name: `revision-${n}`, id: id(i), checked: i === 0 }, []),
            element('label', { htmlFor: id(i) }, name(i)),
          ]),
        ),
        ...versions.map(({ node: v }: any, i: number) =>
          element('section', { className: ['revision'], dataCurrent: i === 0, dataShownBy: id(i) }, v.children),
        ),
      ]);
    };

    // Children first, so an addendum inside a version is converted too.
    const walk = (parent: any) => {
      for (const [i, node] of (parent.children ?? []).entries()) {
        if (node.type === 'containerDirective' && node.name === 'version') {
          throw new Error(`${where(node)}: :::version belongs inside ::::revisions`);
        }
        const convert = node.type === 'containerDirective' && (node.name === 'addendum' || node.name === 'revisions');
        if (convert && node.name === 'revisions') {
          for (const v of node.children) if (v.type === 'containerDirective' && v.name === 'version') walk(v);
        } else {
          walk(node);
        }
        if (node.type === 'containerDirective' && node.name === 'addendum') parent.children[i] = addendum(node);
        if (node.type === 'containerDirective' && node.name === 'revisions') parent.children[i] = revisions(node);
      }
    };

    // A fence that closed nothing stays as the last line of a paragraph.
    // Before converting, so this is the error shown rather than one about
    // what the broken nesting left inside ::::revisions.
    // Only plain text counts: `:::` in inline code is not a fence.
    const plain = (p: any) => p.children.filter((c: any) => c.type === 'text').map((c: any) => c.value).join('');
    const stray = (start: number) =>
      descendants(tree, 'paragraph').find((p) => (p.position?.start.line ?? 0) > start && STRAY_FENCE.test(plain(p)));
    const ours = [...descendants(tree, 'containerDirective')].filter((d) => ['addendum', 'revisions', 'version'].includes(d.name));
    if (ours.length) {
      const fence = stray(Math.min(...ours.map((d) => d.position?.start.line ?? 0)) - 1);
      if (fence) {
        const line = (fence.position?.start.line ?? 0) + plain(fence).split('\n').findIndex((l: string) => /^\s*:{3,}\s*$/.test(l));
        throw new Error(
          `${file.path ?? 'post'}:${line}: a stray ":::" closes nothing; a directive inside another needs fewer colons than the one around it (:::::revisions > ::::version > :::gallery)`,
        );
      }
    }

    walk(tree);
    if (!dates.length) return;

    const frontmatter = (((file.data ??= {}).astro ??= {}).frontmatter ??= {});
    frontmatter.updated = dates.reduce((a, b) => (b > a ? b : a));
    if (hidden.length) frontmatter.revisionHiddenHeadings = hidden;
  };
}
