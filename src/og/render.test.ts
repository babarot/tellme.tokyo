import { describe, expect, it } from 'vitest';
import { phrases, titleSize } from './kit';
import { designs, renderOg } from './render';
import type { OgDesignName } from '../config';

describe('phrases', () => {
  it('splits a Japanese title where a line may break', () => {
    expect(phrases('Obsidianからブログを更新できるようにした')).toEqual(['Obsidianから', 'ブログを', '更新できるようにした']);
  });

  it('keeps short kana endings with the phrase before', () => {
    expect(phrases('自作ツールの gomi をアップデートをした').at(-1)).toBe('アップデートをした');
  });

  it('moves spaces to the end of the phrase before', () => {
    expect(phrases('gomi を XDG Trash 仕様に対応させた')).toEqual(['gomi を ', 'XDG Trash 仕様に', '対応させた']);
  });
});

describe('titleSize', () => {
  it('is larger for shorter titles', () => {
    expect(titleSize('gomi')).toBeGreaterThan(titleSize('dotfiles を AI agent のために作り変えた'));
    expect(titleSize('あ'.repeat(40))).toBeGreaterThan(titleSize('あ'.repeat(60)));
  });
});

describe('renderOg', () => {
  it('has designs of both kinds', () => {
    expect(designs.default.perPost).toBe(true);
    expect(designs.pixel.perPost).toBe(false);
  });

  // Only designs whose fonts are committed: the others would fetch from Google Fonts
  for (const name of Object.keys(designs) as OgDesignName[]) {
    const local = designs[name].fonts.every((f) => 'file' in f);
    it.skipIf(!local)(`draws a 1200x630 PNG with "${name}", for a post and for the top page`, async () => {
      for (const input of [{ title: 'テスト', date: '2026-10-01' }, {}]) {
        const png = await renderOg(input, name);
        expect(png.subarray(1, 4).toString()).toBe('PNG');
        expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
      }
    });
  }

  it('lays out "default" for a post and for the top page', () => {
    const post = JSON.stringify(designs.default.draw({ title: 'テスト', date: '2026-10-01' }));
    expect(post).toContain('テスト');
    expect(post).toContain('2026-10-01');
    expect(JSON.stringify(designs.default.draw({}))).toContain('tellme.tokyo');
  });
});
