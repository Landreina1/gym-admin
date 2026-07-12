import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('gym_token')?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === '/login';
  const isPublic = isLoginPage;

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Excluir assets internos de Next y archivos estáticos (imágenes, íconos),
  // para que el logo/favicon carguen incluso sin sesión (ej. en /login).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)'],
};
