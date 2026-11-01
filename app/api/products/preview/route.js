export const dynamic = 'force-dynamic';

// Shareable product preview card: /api/products/preview?name=Laptop
export async function GET(request) {
  const name = new URL(request.url).searchParams.get('name') ?? '';
  return new Response(
    `<!doctype html><html><body><h1>NOVA preview</h1><p>${name}</p></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
