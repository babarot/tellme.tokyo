// The site's Open Graph image: the top page's, and every page's when the
// design has one image for the whole site.
import { renderOg } from '../og/render';

export async function GET() {
  return new Response(new Uint8Array(await renderOg({})), { headers: { 'content-type': 'image/png' } });
}
