
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth, useUser, initiateEmailSignIn, initiateEmailSignUp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { HeartPulse, User, Calendar, GitCommitHorizontal, Weight } from 'lucide-react';
import { Auth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
        />
        <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
        />
        <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
        />
        <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
        />
        <path d="M1 1h22v22H1z" fill="none" />
    </svg>
);


const initiateGoogleSignIn = (auth: Auth) => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
}

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpAge, setSignUpAge] = useState('');
  const [signUpHeight, setSignUpHeight] = useState('');
  const [signUpWeight, setSignUpWeight] = useState('');


  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please enter email and password." });
      return;
    }
    initiateEmailSignIn(auth, signInEmail, signInPassword);
  };
  
  const handleGoogleSignIn = () => {
    initiateGoogleSignIn(auth);
  }

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword || !signUpName || !signUpAge || !signUpHeight || !signUpWeight) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill out all fields." });
      return;
    }
    initiateEmailSignUp(auth, signUpEmail, signUpPassword);
    // In a real app, you'd save the extra details (name, age, etc.) to Firestore here
    // associated with the user's UID after successful signup.
  };

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-gray-50 to-blue-50 p-4 font-body">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex overflow-hidden min-h-[600px]">
        
        {/* Left Panel: Sign In */}
        <div className="w-1/2 p-8 flex flex-col justify-center">
            <form onSubmit={handleSignIn} className="space-y-4">
                <h1 className="text-3xl font-bold text-green-800 text-center">Welcome Back</h1>
                <p className="text-center text-gray-600 mb-6">Sign in to access your personal health dashboard.</p>

                <div className="flex justify-center my-4">
                  <Button variant="outline" onClick={handleGoogleSignIn} className="w-full max-w-xs">
                      <GoogleIcon />
                      <span className="ml-2">Sign in with Google</span>
                  </Button>
                </div>
                <div className="flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-400">or</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>
                
                <Input type="email" placeholder="Email" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} required className="bg-green-50/50 border-green-200"/>
                <Input type="password" placeholder="Password" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} required className="bg-green-50/50 border-green-200"/>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white" type="submit">Sign In</Button>
            </form>
        </div>

        {/* Right Panel: Sign Up */}
        <div className="w-1/2 p-8 flex flex-col justify-center bg-gradient-to-br from-green-500 to-blue-500 text-white">
            <form onSubmit={handleSignUp} className="space-y-3">
                <div className='text-center mb-4'>
                    <HeartPulse className="w-12 h-12 mb-2 mx-auto"/>
                    <h1 className="text-3xl font-bold">New User?</h1>
                    <p className="text-sm">Create an account to start your wellness journey.</p>
                </div>
                
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-200"/>
                    <Input type="text" placeholder="Username" value={signUpName} onChange={e => setSignUpName(e.target.value)} required className="pl-10 bg-white/20 text-white placeholder:text-gray-200 border-white/30"/>
                </div>
                <Input type="email" placeholder="Email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} required className="bg-white/20 text-white placeholder:text-gray-200 border-white/30"/>
                <Input type="password" placeholder="Password" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} required className="bg-white/20 text-white placeholder:text-gray-200 border-white/30"/>
                
                <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                         <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-200"/>
                        <Input type="number" placeholder="Age" value={signUpAge} onChange={e => setSignUpAge(e.target.value)} required className="pl-10 bg-white/20 text-white placeholder:text-gray-200 border-white/30"/>
                    </div>
                     <div className="relative">
                        <GitCommitHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-200 rotate-90"/>
                        <Input type="number" placeholder="Height (cm)" value={signUpHeight} onChange={e => setSignUpHeight(e.target.value)} required className="pl-10 bg-white/20 text-white placeholder:text-gray-200 border-white/30"/>
                    </div>
                     <div className="relative">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-200"/>
                        <Input type="number" placeholder="Weight (kg)" value={signUpWeight} onChange={e => setSignUpWeight(e.target.value)} required className="pl-10 bg-white/20 text-white placeholder:text-gray-200 border-white/30"/>
                    </div>
                </div>

                <Button variant="outline" className="w-full bg-transparent border-white text-white hover:bg-white/20" type="submit">Sign Up</Button>
            </form>
        </div>
      </div>
    </div>
  );
}
