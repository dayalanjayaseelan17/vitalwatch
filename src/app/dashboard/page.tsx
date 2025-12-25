'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = () => {
    signOut(auth);
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md text-center">
        <h1 className="text-2xl font-bold text-green-700">Dashboard</h1>
        <p className="mt-4 text-gray-600">
          Welcome back, <span className="font-semibold">{user.email}</span>!
        </p>
        <p className="mt-2 text-sm text-gray-500">
          This is your personal health dashboard. More features coming soon.
        </p>
        <Button
          onClick={handleSignOut}
          className="mt-6 w-full bg-red-500 text-white hover:bg-red-600"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
