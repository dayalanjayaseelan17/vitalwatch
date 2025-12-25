
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, User as UserIcon, Loader2, Edit, ShieldQuestion, Droplets, Pill } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Webcam from 'react-webcam';
import { setDocumentNonBlocking } from '@/firebase';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  age: z.number().min(1, 'Age is required'),
  gender: z.string().min(1, 'Gender is required'),
  height: z.number().min(1, 'Height is required'),
  weight: z.number().min(1, 'Weight is required'),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  existingConditions: z.array(z.string()).optional(),
  otherCondition: z.string().optional(),
  allergies: z.string().min(1, 'Please specify if you have allergies'),
  allergiesDetails: z.string().optional(),
  currentMedications: z.string().optional(),
  photoURL: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const medicalConditions = [
    { id: 'diabetes', label: 'Diabetes' },
    { id: 'hypertension', label: 'Hypertension' },
    { id: 'heart-disease', label: 'Heart Disease' },
    { id: 'asthma', label: 'Asthma' },
];

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isEditMode, setIsEditMode] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [newPhotoDataUrl, setNewPhotoDataUrl] = useState<string | null>(null);

  const webcamRef = React.useRef<Webcam>(null);

  const docRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}/profile`, 'main');
  }, [firestore, user]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
        existingConditions: [],
    }
  });

  const allergiesValue = watch('allergies');
  const existingConditionsValue = watch('existingConditions') || [];

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      if (!docRef) return;
      setIsLoading(true);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as ProfileFormValues;
          setProfileData(data);
          reset(data);
          setIsEditMode(false);
        } else {
          setIsEditMode(true);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not fetch your profile.',
        });
        setIsEditMode(true); // Allow user to create profile
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, isUserLoading, router, docRef, reset, toast]);

  const uploadProfilePhoto = async (photoDataUrl: string, userId: string): Promise<string> => {
    const storage = getStorage();
    const storageRef = ref(storage, `users/${userId}/profile.jpg`);
    
    setIsUploading(true);
    try {
        await uploadString(storageRef, photoDataUrl, 'data_url');
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image: ", error);
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "Could not upload your profile photo.",
        });
        throw error;
    } finally {
        setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!docRef || !user) return;

    try {
        setIsLoading(true);
        let finalData = { ...data };

        if (newPhotoDataUrl) {
            const photoURL = await uploadProfilePhoto(newPhotoDataUrl, user.uid);
            finalData.photoURL = photoURL;
        }

      setDocumentNonBlocking(docRef, finalData, { merge: true });
      
      setProfileData(finalData);
      reset(finalData);
      setIsEditMode(false);
      setNewPhotoDataUrl(null);

      toast({
        title: 'Profile Saved',
        description: 'Your information has been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'There was an error saving your profile.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setNewPhotoDataUrl(result);
        setValue('photoURL', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setNewPhotoDataUrl(imageSrc);
      setValue('photoURL', imageSrc);
      setIsCameraOpen(false);
    }
  }, [webcamRef, setValue]);

  if (isLoading || isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }
  
  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 flex gap-4">
          <Button onClick={() => setIsCameraOpen(false)} variant="destructive" size="lg" className="rounded-full h-16 w-16">
            <Camera size={32} />
          </Button>
          <Button onClick={capturePhoto} size="lg" className="rounded-full h-16 w-16 bg-green-600 hover:bg-green-700">
            <UserIcon size={32}/>
          </Button>
        </div>
      </div>
    );
  }

  if (!isEditMode && profileData) {
    // View Mode
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <Avatar className="w-32 h-32 border-4 border-green-200">
              <AvatarImage src={profileData.photoURL} />
              <AvatarFallback className="bg-green-100 text-green-600 text-4xl">
                {profileData.fullName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800">{profileData.fullName}</h1>
              <p className="text-gray-500">{`${profileData.age} years old · ${profileData.gender}`}</p>
            </div>
            <Button onClick={() => setIsEditMode(true)} className="ml-auto bg-gray-200 text-gray-700 hover:bg-gray-300">
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </div>
          <hr className="my-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Personal Details</h2>
              <div className="space-y-3">
                <p><strong>Height:</strong> {profileData.height} cm</p>
                <p><strong>Weight:</strong> {profileData.weight} kg</p>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Medical Information</h2>
              <div className="space-y-3">
                <p><strong>Blood Group:</strong> {profileData.bloodGroup}</p>
                <p><strong>Allergies:</strong> {profileData.allergies} {profileData.allergies === 'Yes' ? `(${profileData.allergiesDetails})` : ''}</p>
                 <div>
                  <strong>Existing Conditions:</strong>
                  <ul className="list-disc pl-5">
                    {profileData.existingConditions?.map(c => c !== 'other' && <li key={c}>{medicalConditions.find(mc => mc.id === c)?.label}</li>)}
                    {profileData.otherCondition && <li>{profileData.otherCondition}</li>}
                  </ul>
                </div>
                <p><strong>Current Medications:</strong> {profileData.currentMedications || 'None'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{profileData ? 'Edit Your Profile' : 'Create Your Profile'}</h1>
        
        {/* Personal Info */}
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Personal Information</h2>
            <div className="flex flex-col items-center gap-6 mb-6">
                <Avatar className="w-32 h-32 cursor-pointer" onClick={() => document.getElementById('photo-upload')?.click()}>
                    <AvatarImage src={newPhotoDataUrl || watch('photoURL')} />
                    <AvatarFallback className="bg-green-100"><Camera className="h-12 w-12 text-green-500" /></AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => document.getElementById('photo-upload')?.click()}>Upload</Button>
                    <Button type="button" variant="outline" onClick={() => setIsCameraOpen(true)}>Use Camera</Button>
                </div>
                <input type="file" id="photo-upload" accept="image/*" onChange={handleImageFileChange} className="hidden" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" {...register('fullName')} />
                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" {...register('age', { valueAsNumber: true })} />
                    {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>}
                </div>
                <div className="md:col-span-2">
                    <Label>Gender</Label>
                     <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 mt-2">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Male" id="male" /><Label htmlFor="male">Male</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Female" id="female" /><Label htmlFor="female">Female</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Other" id="other" /><Label htmlFor="other">Other</Label></div>
                            </RadioGroup>
                        )}
                    />
                    {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
                </div>
                 <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input id="height" type="number" {...register('height', { valueAsNumber: true })} />
                    {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height.message}</p>}
                </div>
                <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" type="number" {...register('weight', { valueAsNumber: true })} />
                    {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>}
                </div>
            </div>
        </div>

        {/* Medical Info */}
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Medical Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Input id="bloodGroup" {...register('bloodGroup')} />
                    {errors.bloodGroup && <p className="text-red-500 text-sm mt-1">{errors.bloodGroup.message}</p>}
                </div>
                <div className="md:col-span-2">
                    <Label>Existing Medical Conditions</Label>
                     <Controller
                        name="existingConditions"
                        control={control}
                        render={({ field }) => (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                            {medicalConditions.map((item) => (
                                <div key={item.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={item.id}
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), item.id])
                                                : field.onChange(field.value?.filter((value) => value !== item.id))
                                        }}
                                    />
                                    <Label htmlFor={item.id}>{item.label}</Label>
                                </div>
                            ))}
                             <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="other-condition"
                                        checked={field.value?.includes('other')}
                                        onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), 'other'])
                                                : field.onChange(field.value?.filter((value) => value !== 'other'))
                                        }}
                                    />
                                    <Label htmlFor="other-condition">Other</Label>
                                </div>
                            </div>
                        )}
                    />
                    {existingConditionsValue.includes('other') && (
                        <Input {...register('otherCondition')} placeholder="Please specify" className="mt-2" />
                    )}
                </div>
                 <div className="md:col-span-2">
                    <Label>Any Allergies?</Label>
                     <Controller
                        name="allergies"
                        control={control}
                        render={({ field }) => (
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 mt-2">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="allergy-yes" /><Label htmlFor="allergy-yes">Yes</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="allergy-no" /><Label htmlFor="allergy-no">No</Label></div>
                            </RadioGroup>
                        )}
                    />
                    {allergiesValue === 'Yes' && (
                        <Input {...register('allergiesDetails')} placeholder="Please describe your allergies" className="mt-2" />
                    )}
                    {errors.allergies && <p className="text-red-500 text-sm mt-1">{errors.allergies.message}</p>}
                </div>
                 <div className="md:col-span-2">
                    <Label htmlFor="currentMedications">Current Medications (Optional)</Label>
                    <Input id="currentMedications" {...register('currentMedications')} />
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-4">
          {profileData && <Button type="button" variant="ghost" onClick={() => setIsEditMode(false)}>Cancel</Button>}
          <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading || isUploading}>
            {(isLoading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
