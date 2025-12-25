
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
    
    // We use a separate function to handle the async logic after user creation
    const handleUserCreation = (userCredential: UserCredential) => {
      const newUser = userCredential.user;
      const profileData = {
        id: newUser.uid,
        email: signUpEmail,
        fullName: signUpName,
        age: parseInt(signUpAge, 10),
        height: parseInt(signUpHeight, 10),
        weight: parseInt(signUpWeight, 10),
      };

      const docRef = doc(firestore, `users/${newUser.uid}/profile`, 'main');
      setDocumentNonBlocking(docRef, profileData, { merge: true });
    };

    // Temporarily listen for auth state changes to catch the new user
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user && user.email === signUpEmail) {
        handleUserCreation({ user } as UserCredential);
        unsubscribe(); // Stop listening
      }
    });

    initiateEmailSignUp(auth, signUpEmail, signUpPassword);
  };

  if (isUserLoading || (!isUserLoading && user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-600"></div>
      </div>
    );
  }
  
  const FormInput = ({icon, type, placeholder, value, onChange}: {icon: React.ReactNode, type:string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}) => (
     <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400">
            {icon}
        </div>
        <Input type={type} placeholder={placeholder} value={value} onChange={onChange} required className="pl-10 bg-green-50/50 border-green-200 focus:bg-white"/>
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-gray-50 to-blue-50 p-4 font-body">
        <div className={cn("relative w-full max-w-4xl min-h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-700 ease-in-out", 
            isSignIn ? " " : " "
        )}>
            
            {/* Sign Up Form */}
            <div className={cn("absolute top-0 left-0 h-full w-1/2 flex items-center justify-center transition-all duration-700 ease-in-out",
                isSignIn ? "translate-x-full opacity-0 z-10" : "translate-x-0 opacity-100 z-20"
            )}>
                <form onSubmit={handleSignUp} className="w-full px-8 space-y-4">
                    <div className='text-center mb-6'>
                        <h1 className="text-3xl font-bold text-green-800">Get Your Health Checked</h1>
                        <p className="text-sm text-gray-500">Create an account to start your wellness journey.</p>
                    </div>

                    <FormInput icon={<User />} type="text" placeholder="Username" value={signUpName} onChange={e => setSignUpName(e.target.value)} />
                    <FormInput icon={<Mail />} type="email" placeholder="Email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} />
                    <FormInput icon={<Lock />} type="password" placeholder="Password" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} />

                    <div className="grid grid-cols-3 gap-2 pt-2">
                        <FormInput icon={<Calendar />} type="number" placeholder="Age" value={signUpAge} onChange={e => setSignUpAge(e.target.value)} />
                        <FormInput icon={<GitCommitHorizontal className="rotate-90"/>} type="number" placeholder="Height (cm)" value={signUpHeight} onChange={e => setSignUpHeight(e.target.value)} />
                        <FormInput icon={<Weight />} type="number" placeholder="Weight (kg)" value={signUpWeight} onChange={e => setSignUpWeight(e.target.value)} />
                    </div>

                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white !mt-6" type="submit">Sign Up</Button>
                </form>
            </div>

             {/* Sign In Form */}
            <div className={cn("absolute top-0 left-0 h-full w-1/2 flex items-center justify-center transition-all duration-700 ease-in-out",
                isSignIn ? "translate-x-full opacity-100 z-20" : "translate-x-0 opacity-0 z-10"
            )}>
                <form onSubmit={handleSignIn} className="w-full px-8 space-y-4">
                    <div className='text-center mb-6'>
                        <h1 className="text-3xl font-bold text-green-800">Welcome Back</h1>
                        <p className="text-sm text-gray-500">Sign in to continue managing your health.</p>
                    </div>
                    
                    <div className="flex justify-center my-4">
                        <Button variant="outline" onClick={handleGoogleSignIn} className="w-full max-w-xs">
                            <GoogleIcon />
                            <span className="ml-2">Sign in with Google</span>
                        </Button>
                    </div>
                    <div className="flex items-center">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-sm">or with email</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    <FormInput icon={<Mail />} type="email" placeholder="Email" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} />
                    <FormInput icon={<Lock />} type="password" placeholder="Password" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} />
                    
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white !mt-6" type="submit">Sign In</Button>
                </form>
            </div>

            {/* Overlay */}
            <div className={cn("absolute top-0 left-0 h-full w-1/2 bg-green-500 rounded-2xl shadow-2xl overflow-hidden text-white flex items-center justify-center transition-all duration-700 ease-in-out z-30", 
                isSignIn ? "translate-x-0 rounded-r-2xl" : "translate-x-full rounded-l-2xl"
            )}>
                 <div className={cn("absolute h-full w-full flex items-center justify-center text-center transition-all duration-700 ease-in-out p-8",
                    isSignIn ? "translate-x-full" : "translate-x-0 "
                )}>
                    <div className="space-y-4">
                        <HeartPulse className="w-16 h-16 mx-auto"/>
                        <h1 className="text-3xl font-bold">Already a Member?</h1>
                        <p>Sign in to access your personal health dashboard.</p>
                        <Button variant="outline" onClick={() => setIsSignIn(true)} className="bg-transparent border-white text-white hover:bg-white/20">
                            Sign In
                        </Button>
                    </div>
                </div>
                 <div className={cn("absolute h-full w-full flex items-center justify-center text-center transition-all duration-700 ease-in-out p-8",
                    isSignIn ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="space-y-4">
                        <HeartPulse className="w-16 h-16 mx-auto"/>
                        <h1 className="text-3xl font-bold">New Here?</h1>
                        <p>Create an account to begin your health journey.</p>
                        <Button variant="outline" onClick={() => setIsSignIn(false)} className="bg-transparent border-white text-white hover:bg-white/20">
                            Sign Up
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
}

    
