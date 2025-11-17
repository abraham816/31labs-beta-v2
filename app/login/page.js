'use client';
import { LoginPage } from '@/components/LoginPage';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  
  return (
    <LoginPage 
      onBack={() => router.push('/')}
      onBackHome={() => router.push('/')}
    />
  );
}
