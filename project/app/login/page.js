'use client';

import { useRouter } from 'next/navigation';
import { LoginPage } from '@/components/LoginPage';

export default function Login() {
  const router = useRouter();

  const handleLogin = (email, password) => {
    localStorage.setItem('isLoggedIn', 'true');
    router.push('/dashboard');
  };

  return (
    <LoginPage
      onLogin={handleLogin}
      onBack={() => router.push('/')}
      onBackHome={() => router.push('/')}
    />
  );
}
