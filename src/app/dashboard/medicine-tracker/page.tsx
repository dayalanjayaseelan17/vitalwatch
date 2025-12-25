
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Pill, Calendar as CalendarIcon, Clock, Bell, Trash2, Loader2, Info } from 'lucide-react';
import { format, formatISO, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, setDocumentNonBlocking, WithId } from '@/firebase';
import { useRouter } from 'next/navigation';

// Schemas
const medicineSchema = z.object({
  name: z.string().min(1, "Medicine name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  schedule: z.object({
    morning: z.boolean().default(false),
    afternoon: z.boolean().default(false),
    night: z.boolean().default(false),
  }).refine(data => data.morning || data.afternoon || data.night, {
    message: "At least one time slot must be selected",
    path: ["schedule"]
  }),
  startDate: z.date(),
  endDate: z.date().optional(),
  isOngoing: z.boolean().default(false),
  reminders: z.boolean().default(false),
});

type MedicineFormValues = z.infer<typeof medicineSchema>;

interface Medicine extends MedicineFormValues {
  id: string;
}

interface MedicineLog {
  [medicineId: string]: {
    morning?: 'taken' | 'missed';
    afternoon?: 'taken' | 'missed';
    night?: 'taken' | 'missed';
  }
}

// Components
const AddMedicineDialog = ({ onAdd }: { onAdd: (data: MedicineFormValues) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<MedicineFormValues>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      schedule: { morning: false, afternoon: false, night: false },
      isOngoing: false,
      reminders: false,
      startDate: new Date(),
    }
  });

  const isOngoing = watch('isOngoing');

  const onSubmit = (data: MedicineFormValues) => {
    onAdd(data);
    reset();
    setIsOpen(false);
    toast({
      title: "Medicine Added",
      description: `${data.name} has been added to your tracker.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-green-600 hover:bg-green-700">
          <PlusCircle className="mr-2" /> Add New Medicine
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Medicine</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Medicine Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="dosage">Dosage (e.g., 1 tablet, 5ml)</Label>
            <Input id="dosage" {...register('dosage')} />
            {errors.dosage && <p className="text-red-500 text-sm mt-1">{errors.dosage.message}</p>}
          </div>
          <div>
            <Label>Time Selection</Label>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                <Controller name="schedule.morning" control={control} render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} id="morning" />} />
                <Label htmlFor="morning">Morning</Label>
              </div>
              <div className="flex items-center gap-2">
                <Controller name="schedule.afternoon" control={control} render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} id="afternoon" />} />
                <Label htmlFor="afternoon">Afternoon</Label>
              </div>
              <div className="flex items-center gap-2">
                <Controller name="schedule.night" control={control} render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} id="night" />} />
                <Label htmlFor="night">Night</Label>
              </div>
            </div>
            {errors.schedule && <p className="text-red-500 text-sm mt-1">{errors.schedule.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <Label>Start Date</Label>
              <Controller
                control={control}
                name="startDate"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
            <div>
              <Label>End Date</Label>
               <Controller
                control={control}
                name="endDate"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isOngoing}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={isOngoing} />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
          </div>
           <div className="flex items-center gap-2">
            <Controller name="isOngoing" control={control} render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} id="isOngoing" />} />
            <Label htmlFor="isOngoing">Ongoing</Label>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="reminders">Enable Reminders</Label>
            <Controller name="reminders" control={control} render={({ field }) => <Switch id="reminders" checked={field.value} onCheckedChange={field.onChange} />} />
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Add Medicine</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};


const MedicineCard = ({ medicine, log, onToggle }: { medicine: WithId<Medicine>, log: MedicineLog | null, onToggle: (medicineId: string, time: 'morning' | 'afternoon' | 'night', status: 'taken' | 'missed') => void }) => {
  
  const medLog = log?.[medicine.id] || {};

  const DoseButton = ({ time, label }: { time: 'morning' | 'afternoon' | 'night', label: string }) => {
    if (!medicine.schedule[time]) return null;

    const status = medLog[time];

    return (
      <Button
        variant={status === 'taken' ? 'default' : 'outline'}
        size="sm"
        className={cn("w-full", {
          'bg-green-600 hover:bg-green-700 text-white': status === 'taken',
          'bg-red-100 text-red-700': status === 'missed',
        })}
        onClick={() => onToggle(medicine.id, time, status === 'taken' ? 'missed' : 'taken')}
      >
        {label}
      </Button>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Pill /> {medicine.name}</span>
          {medicine.reminders && <Bell className="text-green-600" size={16}/>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">Dosage: {medicine.dosage}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
            <DoseButton time="morning" label="Morning" />
            <DoseButton time="afternoon" label="Afternoon" />
            <DoseButton time="night" label="Night" />
        </div>
      </CardContent>
    </Card>
  );
};


export default function MedicineTrackerPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const today = formatISO(new Date(), { representation: 'date' }); // YYYY-MM-DD

  const medicinesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/medicines`);
  }, [firestore, user]);

  const { data: medicines, isLoading: isLoadingMedicines } = useCollection<Medicine>(medicinesCollectionRef);

  const [medicineLog, setMedicineLog] = useState<MedicineLog | null>(null);
  const [isLoadingLog, setIsLoadingLog] = useState(true);

  // Fetch today's log
  useEffect(() => {
    if (!firestore || !user) return;
    const logDocRef = doc(firestore, `users/${user.uid}/medicineLog`, today);
    const unsubscribe = onSnapshot(logDocRef, (docSnap) => {
      setMedicineLog(docSnap.exists() ? docSnap.data() as MedicineLog : {});
      setIsLoadingLog(false);
    });
    return unsubscribe;
  }, [firestore, user, today]);

  const handleAddMedicine = (data: MedicineFormValues) => {
    if (!medicinesCollectionRef) return;
    addDocumentNonBlocking(medicinesCollectionRef, { 
      ...data, 
      createdAt: serverTimestamp(),
      startDate: formatISO(data.startDate, { representation: 'date' }),
      endDate: data.endDate ? formatISO(data.endDate, { representation: 'date' }) : null,
    });
  };

  const handleToggleDose = (medicineId: string, time: 'morning' | 'afternoon' | 'night', status: 'taken' | 'missed') => {
    if (!firestore || !user) return;

    const logDocRef = doc(firestore, `users/${user.uid}/medicineLog`, today);
    
    const currentStatus = medicineLog?.[medicineId]?.[time];
    const newStatus = currentStatus === status ? undefined : status;
    
    const updatePath = `${medicineId}.${time}`;

    setDocumentNonBlocking(logDocRef, { [updatePath]: newStatus }, { merge: true });
  };
  
  const dailyProgress = useMemo(() => {
    if (!medicines || !medicineLog) return 0;
    
    let totalDoses = 0;
    let takenDoses = 0;

    medicines.forEach(med => {
        const medLog = medicineLog[med.id] || {};
        if(med.schedule.morning) totalDoses++;
        if(med.schedule.afternoon) totalDoses++;
        if(med.schedule.night) totalDoses++;
        
        if(medLog.morning === 'taken') takenDoses++;
        if(medLog.afternoon === 'taken') takenDoses++;
        if(medLog.night === 'taken') takenDoses++;
    });

    return totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;
  }, [medicines, medicineLog]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isLoadingMedicines || isUserLoading || isLoadingLog) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Medicine Tracker</h1>
            <p className="text-gray-500">Your daily medication schedule for {format(new Date(), 'eeee, MMMM d')}.</p>
          </div>
          <AddMedicineDialog onAdd={handleAddMedicine} />
        </header>

        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Today's Progress</CardTitle>
            </CardHeader>
            <CardContent>
                <Progress value={dailyProgress} className="h-4"/>
                <p className="text-right text-sm text-gray-600 mt-2">{Math.round(dailyProgress)}% complete</p>
            </CardContent>
        </Card>

        {medicines && medicines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {medicines.map((med) => (
              <MedicineCard key={med.id} medicine={med} log={medicineLog} onToggle={handleToggleDose} />
            ))}
          </div>
        ) : (
          <Card className="text-center p-8">
              <Pill className="mx-auto h-12 w-12 text-gray-400"/>
              <h3 className="mt-4 text-lg font-medium text-gray-800">No Medicines Added Yet</h3>
              <p className="mt-1 text-sm text-gray-500">Click "Add New Medicine" to get started.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
