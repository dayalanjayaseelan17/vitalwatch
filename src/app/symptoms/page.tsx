
'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, FileUp, X, Check, Loader2 } from 'lucide-react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: 'environment',
};

export default function SymptomsPage() {
  const [description, setDescription] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const { toast } = useToast();

  const webcamRef = useRef<Webcam>(null);
  const router = useRouter();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setImageDataUrl(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImageDataUrl(imageSrc);
      setIsCameraOpen(false);
    }
  }, [webcamRef]);

  const handleCheckSymptoms = () => {
    if (!description.trim() && !imageDataUrl) {
      toast({
        variant: 'destructive',
        title: 'Input Required',
        description: 'Please describe your problem or upload a photo.',
      });
      return;
    }

    setLoading(true);

    // Save all data to localStorage
    localStorage.setItem('symptomDescription', description);

    if (imageDataUrl) {
      localStorage.setItem('symptomImage', imageDataUrl);
    } else {
      localStorage.removeItem('symptomImage');
    }

    router.push('/result');
  };

  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 flex gap-4">
          <Button
            onClick={() => setIsCameraOpen(false)}
            variant="destructive"
            size="lg"
            className="rounded-full h-16 w-16"
          >
            <X size={32} />
          </Button>
          <Button
            onClick={capturePhoto}
            size="lg"
            className="rounded-full h-16 w-16 bg-green-600 hover:bg-green-700"
          >
            <Check size={32} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardContent className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-green-800">
              Symptom Checker
            </h1>
            <p className="text-gray-600 mt-1">
              Explain your problem and optionally add a photo.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <Label
                htmlFor="symptom-description"
                className="font-semibold text-gray-700"
              >
                Symptom Description
              </Label>
              <Textarea
                id="symptom-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain your problem or symptoms here (e.g., fever for 2 days, pain in leg)..."
                className="mt-2 min-h-[120px] text-base"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-gray-700">
                Add a Photo (Optional)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById('image-upload-input')?.click()
                  }
                  disabled={loading}
                  className="h-12 text-base"
                >
                  <FileUp className="mr-2 h-5 w-5" /> Upload Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCameraOpen(true)}
                  disabled={loading}
                  className="h-12 text-base"
                >
                  <Camera className="mr-2 h-5 w-5" /> Take Photo
                </Button>
                <input
                  id="image-upload-input"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {imageDataUrl && (
              <div className="relative w-full max-w-xs mx-auto">
                <p className="text-sm font-medium text-gray-700 mb-2 text-center">
                  Image Preview:
                </p>
                <img
                  src={imageDataUrl}
                  alt="Symptom preview"
                  className="rounded-md w-full"
                />
                <button
                  type="button"
                  onClick={() => setImageDataUrl(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <Button
              type="button"
              onClick={handleCheckSymptoms}
              disabled={loading}
              className="w-full text-lg h-12 bg-green-600 hover:bg-green-700 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...
                </>
              ) : (
                'Check Symptoms'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
