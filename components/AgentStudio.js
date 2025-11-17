// Add this import at the top
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Add inside your component:
const router = useRouter();

const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push('/');
};

// Add logout button in your header (near "Open Agent Studio" or top-right):
<button onClick={handleLogout} className="text-neutral-600 hover:text-neutral-900">
  Logout
</button>
