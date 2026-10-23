import { describe, expect, it } from 'vitest';
import { languageOf, parseSource, selectLines } from './source';

describe('parseSource', () => {
  it('reads the repository, ref, path and lines of a file URL', () => {
    expect(parseSource('https://github.com/babarot/dotfiles/blob/main/home/.claude/CLAUDE.md?plain=1#L9-L19')).toEqual({
      url: 'https://github.com/babarot/dotfiles/blob/main/home/.claude/CLAUDE.md?plain=1#L9-L19',
      owner: 'babarot',
      repo: 'dotfiles',
      ref: 'main',
      path: 'home/.claude/CLAUDE.md',
      raw: 'https://raw.githubusercontent.com/babarot/dotfiles/main/home/.claude/CLAUDE.md',
      start: 9,
      end: 19,
    });
  });

  it('takes one line, the column forms, and no lines for the whole file', () => {
    expect(parseSource('https://github.com/o/r/blob/main/a.go#L5')).toMatchObject({ start: 5, end: 5 });
    expect(parseSource('https://github.com/o/r/blob/main/a.go#L5C3-L7C10')).toMatchObject({ start: 5, end: 7 });
    expect(parseSource('https://github.com/o/r/blob/main/a.go')).not.toHaveProperty('start');
  });

  it('rejects what is not a file on GitHub, or lines that go backwards', () => {
    expect(parseSource('https://github.com/o/r/tree/main/dir')).toBeNull();
    expect(parseSource('https://gitlab.com/o/r/blob/main/a.go')).toBeNull();
    expect(parseSource('https://github.com/o/r/blob/main/a.go#readme')).toBeNull();
    expect(parseSource('https://github.com/o/r/blob/main/a.go#L9-L3')).toBeNull();
  });
});

describe('selectLines', () => {
  const file = 'one\ntwo\nthree\n';

  it('cuts out the lines asked for', () => {
    expect(selectLines(file, 2, 3)).toBe('two\nthree');
    expect(selectLines(file, 2, 2)).toBe('two');
  });

  it('gives the whole file without lines, and null past its end', () => {
    expect(selectLines(file)).toBe('one\ntwo\nthree');
    expect(selectLines(file, 3, 4)).toBeNull();
  });

  it('reads CRLF files as lines too', () => {
    expect(selectLines('a\r\nb\r\n', 2, 2)).toBe('b');
  });
});

describe('languageOf', () => {
  it('takes the extension, or the name when there is none', () => {
    expect(languageOf('home/.claude/CLAUDE.md')).toBe('md');
    expect(languageOf('src/main.go')).toBe('go');
    expect(languageOf('Makefile')).toBe('makefile');
    expect(languageOf('.zshrc')).toBe('.zshrc');
  });
});
