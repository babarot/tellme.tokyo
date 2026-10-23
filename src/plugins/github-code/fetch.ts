// Fetches a file's text from raw.githubusercontent.com. Network only here.
export type Fetch = typeof fetch;

// null: the file is not there (or the repository is private)
export async function fetchText(raw: string, { fetch: get = fetch, timeout = 10_000 } = {}): Promise<string | null> {
  try {
    const res = await get(raw, { signal: AbortSignal.timeout(timeout) });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}
