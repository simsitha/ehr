import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const targetUrl = `http://127.0.0.1:8081${url.pathname}${url.search}`;
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'x-forwarded-for': request.headers.get('x-forwarded-for') || request.headers.get('host') || '',
      },
    });
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'text/plain' },
    });
  } catch {
    return new Response('OK\n', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const targetUrl = `http://127.0.0.1:8081${url.pathname}${url.search}`;
    const arrayBuf = await request.arrayBuffer();
    const contentType = request.headers.get('Content-Type') || 'text/plain';
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'x-forwarded-for': request.headers.get('x-forwarded-for') || request.headers.get('host') || '',
      },
      body: Buffer.from(arrayBuf),
    });
    const resBuf = await res.arrayBuffer();
    return new Response(resBuf, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'text/plain' },
    });
  } catch {
    return new Response('OK\n', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
}
