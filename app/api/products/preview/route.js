export const dynamic = 'force-dynamic';

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Shareable product preview card: /api/products/preview?name=Laptop
export async function GET(request) {
  const name = new URL(request.url).searchParams.get('name') ?? '';
  return new Response(
    `<!doctype html><html><body><h1>NOVA preview</h1><p>${escapeHtml(name)}</p></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
