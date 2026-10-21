import { NextResponse } from 'next/server';

// Painel numa URL não óbvia: com ADMIN_PATH definido (ex.: "gestao-k7x2p"),
// /gestao-k7x2p abre o painel e /admin devolve 404. Sem a variável (dev), /admin
// continua normal. Isso só reduz ruído e tentativa de invasão; a proteção de
// verdade é o login único + RLS (is_admin) + requireAdmin nas rotas /api/admin.
export function middleware(req) {
  const segredo = process.env.ADMIN_PATH;
  if (!segredo) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const base = `/${segredo}`;

  if (pathname === base || pathname.startsWith(`${base}/`)) {
    const url = req.nextUrl.clone();
    url.pathname = `/admin${pathname.slice(base.length)}`;
    const res = NextResponse.rewrite(url);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return new NextResponse('Not found', { status: 404 });
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/|api/|favicon).*)'] };
