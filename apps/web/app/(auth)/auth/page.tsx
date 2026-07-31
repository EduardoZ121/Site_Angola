import { redirect } from 'next/navigation';

interface AuthIndexProps {
  searchParams: Promise<{ mode?: string; next?: string }>;
}

export default async function AuthIndexPage({ searchParams }: AuthIndexProps) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.next) q.set('next', params.next);
  const qs = q.toString() ? `?${q.toString()}` : '';

  if (params.mode === 'entrar') {
    redirect(`/auth/entrar${qs}`);
  }
  redirect(`/auth/registar${qs}`);
}
