'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth, useUser, initiateEmailSignIn, initiateEmailSignUp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { HeartPulse, User, Calendar, GitCommitHorizontal, Weight, Mail, Lock } from 'lucide-react';
import { Auth, GoogleAuthProvider, signInWithPopup, UserCredential } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

/* ---------------- GOOGLE ICON ---------------- */

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

/* ---------------- FORM INPUT (MOVED OUT) ---------------- */

type FormInputProps = {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const FormInput = ({ icon, type, placeholder, value, onChange }: FormInputProps) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400">
      {icon}
    </div>
    <Input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
      className="pl-10 bg-green-50/50 border-green-200 focus:bg-white"
    />
  </div>
);

/* ---------------- GOOGLE SIGN IN ---------------- */

const initiateGoogleSignIn = (auth: Auth) => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider);
};

/* ======================= PAGE ======================= */

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [isSignIn, setIsSignIn] = useState(false);

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpAge, setSignUpAge] = useState('');
  const [signUpHeight, setSignUpHeight] = useState('');
  const [signUpWeight, setSignUpWeight] = useState('');

  useEffect(() => {
    if (!isUserLoading && user) router.push('/dashboard');
  }, [user, isUserLoading, router]);

  /* ---------------- HANDLERS ---------------- */

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Enter email & password' });
      return;
    }
    initiateEmailSignIn(auth, signInEmail, signInPassword);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword || !signUpName || !signUpAge || !signUpHeight || !signUpWeight) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Fill all fields' });
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) return;

      const profile = {
        id: user.uid,
        email: signUpEmail,
        fullName: signUpName,
        age: Number(signUpAge),
        height: Number(signUpHeight),
        weight: Number(signUpWeight),
      };

      const ref = doc(firestore, `users/${user.uid}/profile`, 'main');
      setDocumentNonBlocking(ref, profile, { merge: true });
      unsubscribe();
    });

    initiateEmailSignUp(auth, signUpEmail, signUpPassword);
  };

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-600" />
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="relative w-full max-w-4xl min-h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* SIGN UP */}
        <div className={cn("absolute w-1/2 h-full flex items-center justify-center transition-all",
          isSignIn ? "translate-x-full opacity-0" : "opacity-100 z-20"
        )}>
          <form onSubmit={handleSignUp} className="w-full px-8 space-y-4">
            <FormInput icon={<User />} type="text" placeholder="Name" value={signUpName} onChange={e => setSignUpName(e.target.value)} />
            <FormInput icon={<Mail />} type="email" placeholder="Email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} />
            <FormInput icon={<Lock />} type="password" placeholder="Password" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} />
            <div className="grid grid-cols-3 gap-2">
              <FormInput icon={<Calendar />} type="number" placeholder="Age" value={signUpAge} onChange={e => setSignUpAge(e.target.value)} />
              <FormInput icon={<GitCommitHorizontal className="rotate-90" />} type="number" placeholder="Height" value={signUpHeight} onChange={e => setSignUpHeight(e.target.value)} />
              <FormInput icon={<Weight />} type="number" placeholder="Weight" value={signUpWeight} onChange={e => setSignUpWeight(e.target.value)} />
            </div>
            <Button className="w-full">Sign Up</Button>
          </form>
        </div>

        {/* SIGN IN */}
        <div className={cn("absolute w-1/2 h-full flex items-center justify-center transition-all",
          isSignIn ? "z-20" : "opacity-0"
        )}>
          <form onSubmit={handleSignIn} className="w-full px-8 space-y-4">
            <FormInput icon={<Mail />} type="email" placeholder="Email" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} />
            <FormInput icon={<Lock />} type="password" placeholder="Password" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} />
            <Button className="w-full">Sign In</Button>
          </form>
        </div>

        {/* OVERLAY */}
        <div className="absolute w-1/2 h-full bg-green-500 text-white flex items-center justify-center z-30 pointer-events-none">
          <Button onClick={() => setIsSignIn(!isSignIn)} className="pointer-events-auto">
            {isSignIn ? 'Sign Up' : 'Sign In'}
          </Button>
        </div>

      </div>
    </div>
  );
}
