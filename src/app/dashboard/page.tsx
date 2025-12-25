'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { User, CalendarCheck, Pill, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type ActiveButton = 'profile' | 'daily' | 'medicine' | 'health' | null;

const DashboardButton = ({
  icon,
  label,
  href,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  return (
    <Link href={href} passHref>
        <div 
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-3 cursor-pointer group"
        >
            <div className={cn(
                "relative flex items-center justify-center w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-green-500 bg-white text-green-600 transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:scale-105 group-hover:border-green-600",
                isActive && "bg-green-600 text-white scale-110 shadow-xl"
            )}>
                <div className="absolute inset-0 rounded-full bg-green-600 transition-transform duration-300 ease-in-out scale-0 origin-center"
                    style={{ transform: isActive ? 'scale(1)' : 'scale(0)' }}
                ></div>
                <div className={cn("relative z-10 transition-transform duration-300", isActive && "scale-110")}>
                    {icon}
                </div>
            </div>
            <span className={cn(
                "font-semibold text-gray-600 transition-colors duration-300 group-hover:text-green-700",
                isActive && "text-green-700 font-bold"
                )}
            >
                {label}
            </span>
        </div>
    </Link>
  );
};

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [activeButton, setActiveButton] = useState<ActiveButton>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = () => {
    signOut(auth);
  };
  
  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 via-gray-50 to-blue-50 p-4 font-body">
      <div className="absolute top-6 right-6 flex items-center gap-4">
        <div className="text-right">
            <p className="font-semibold text-gray-700">Welcome, {user.displayName || user.email}</p>
        </div>
        <Avatar>
            <AvatarImage src={user.photoURL || ''} alt="User avatar" />
            <AvatarFallback className="bg-green-200 text-green-700 font-bold">
                {getInitials(user.email)}
            </AvatarFallback>
        </Avatar>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="bg-white/50 border-red-300 text-red-500 hover:bg-red-500 hover:text-white"
        >
          Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 lg:gap-16">
        <DashboardButton 
            icon={<User className="w-12 h-12 md:w-16 md:h-16" />}
            label="Profile"
            href="#"
            isActive={activeButton === 'profile'}
            onClick={() => setActiveButton('profile')}
        />
        <DashboardButton 
            icon={<CalendarCheck className="w-12 h-12 md:w-16 md:h-16" />}
            label="Daily Tracker"
            href="#"
            isActive={activeButton === 'daily'}
            onClick={() => setActiveButton('daily')}
        />
        <DashboardButton 
            icon={<Pill className="w-12 h-12 md:w-16 md:h-16" />}
            label="Medicine Tracker"
            href="#"
            isActive={activeButton === 'medicine'}
            onClick={() => setActiveButton('medicine')}
        />
        <DashboardButton 
            icon={<Activity className="w-12 h-12 md:w-16 md:h-16" />}
            label="Health Bar"
            href="#"
            isActive={activeButton === 'health'}
            onClick={() => setActiveButton('health')}
        />
      </div>
    </div>
  );
}
