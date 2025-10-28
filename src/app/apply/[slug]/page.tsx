'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Combobox } from '@/components/ui/combobox';
import { ArrowLeft, Send, Camera, X } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { WebcamCapture } from '@/components/webcam-capture';
import { indonesiaRegions, countryCodes } from '@/lib/regions-data';
import type { Job, JobConfig } from '@/types';

export default function JobApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const jobSlug = params.slug as string;
  const { user } = useAuth();
  
  const [job, setJob] = useState<Job | null>(null);
  const [jobConfig, setJobConfig] = useState<JobConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [showWebcam, setShowWebcam] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string>('+62');

  // Redirect admin away from apply page
  useEffect(() => {
    if (user && user.role === 'admin') {
      router.push('/jobs');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, configData] = await Promise.all([
          api.getJobs().catch(() => ({ data: [], config: null })),
          api.getJobConfig().catch(() => ({ application_form: { sections: [] } }))
        ]);
        
        console.log('Jobs Data:', jobsData);
        console.log('Config Data:', configData);
        
        // Find job by slug from backend response
        const foundJob = jobsData.data?.find((j: Job) => j.slug === jobSlug);
        setJob(foundJob || null);
        
        // Priority: Job's own config > Global config > Default fallback
        let finalConfig = null;
        
        if (foundJob?.application_form) {
          // Use job-specific configuration
          finalConfig = { application_form: foundJob.application_form };
          console.log('Using job-specific config');
        } else if (jobsData.config?.application_form) {
          // Use global config from jobs response
          finalConfig = jobsData.config;
          console.log('Using global config from jobs response');
        } else if (configData?.application_form) {
          // Use global config from job-config endpoint
          finalConfig = configData;
          console.log('Using global config from job-config endpoint');
        } else {
          // Default fallback config
          finalConfig = {
            application_form: {
              sections: [
                {
                  title: "Minimum Profile Information Required",
                  fields: [
                    { key: "full_name", validation: { required: true } },
                    { key: "email", validation: { required: true } },
                    { key: "phone_number", validation: { required: true } },
                    { key: "domicile", validation: { required: false } },
                  ]
                }
              ]
            }
          };
          console.log('Using default fallback config');
        }
        
        setJobConfig(finalConfig);
        console.log('Final Config:', finalConfig);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [jobSlug]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWebcamCapture = (file: File) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    handleInputChange('photo_profile', file.name);
    setShowWebcam(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      handleInputChange('photo_profile', file.name);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    handleInputChange('photo_profile', '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress('');

    if (!job) {
      setUploadProgress('Error: Job information not available');
      setIsSubmitting(false);
      return;
    }

    try {
      // Upload photo first if exists
      let photoUrl = '';
      if (photoFile) {
        setUploadProgress('Uploading photo...');
        const uploadResult = await api.uploadPhoto(photoFile);
        photoUrl = uploadResult.url;
        console.log('Photo uploaded:', photoUrl);
      }

      setUploadProgress('Submitting application...');
      
      // Convert form data to candidate attributes format
      const attributes = Object.entries(formData).map(([key, value], index) => ({
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        order: index + 1
      }));

      // Add photo URL to attributes if uploaded
      if (photoUrl) {
        attributes.push({
          key: 'photo_profile',
          label: 'Photo Profile',
          value: photoUrl,
          order: attributes.length + 1
        });
      }

      const candidateData = {
        id: `cand_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        job_id: job.id,
        job_title: job.title,
        attributes
      };

      await api.createCandidate(candidateData);
      
      // Redirect to success page or show success message
      router.push(`/apply/${jobSlug}/success`);
    } catch (error) {
      console.error('Failed to submit application:', error);
      setUploadProgress('Error: Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading application form...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-semibold">Job not found</h3>
          <p className="text-muted-foreground text-center mb-6">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Apply for {job.title}</h1>
        <p className="text-muted-foreground mt-2">
          {job.salary_range?.display_text || 'Competitive salary'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Apply Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Photo Profile */}
            <div className="grid gap-2">
              <Label htmlFor="photo_profile">
                Photo Profile
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="space-y-3">
                {photoPreview ? (
                  <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-primary">
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowWebcam(true)}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Take Photo
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Take a photo using webcam with hand gesture (1, 2, or 3 fingers)
                    </p>
                  </div>
                )}
                {photoFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {photoFile.name} ({(photoFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </div>

            {/* 2. Full Name */}
            <div className="grid gap-2">
              <Label htmlFor="full_name">
                Full Name
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="full_name"
                value={formData.full_name || ''}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* 3. Date of Birth */}
            <div className="grid gap-2">
              <Label htmlFor="date_of_birth">
                Date of Birth
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                required
              />
            </div>

            {/* 4. Pronoun (Gender) - Radio Button */}
            <div className="grid gap-2">
              <Label>
                Pronoun (Gender)
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <RadioGroup
                value={formData.gender || ''}
                onValueChange={(value) => handleInputChange('gender', value)}
                required
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female" className="font-normal cursor-pointer">
                    She/her (Female)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male" className="font-normal cursor-pointer">
                    He/him (Male)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 5. Domicile - Searchable */}
            <div className="grid gap-2">
              <Label htmlFor="domicile">
                Domicile
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Combobox
                options={indonesiaRegions}
                value={formData.domicile || ''}
                onValueChange={(value) => handleInputChange('domicile', value)}
                placeholder="Select your domicile..."
                searchPlaceholder="Search city or regency..."
                emptyText="No location found."
              />
            </div>

            {/* 6. Phone Number with Country Code */}
            <div className="grid gap-2">
              <Label htmlFor="phone_number">
                Phone Number
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="w-[200px]">
                  <Combobox
                    options={countryCodes.map(cc => ({
                      value: cc.value,
                      label: `${cc.flag} ${cc.value} ${cc.country}`
                    }))}
                    value={countryCode}
                    onValueChange={setCountryCode}
                    placeholder="Code"
                    searchPlaceholder="Search country..."
                    emptyText="No country found."
                  />
                </div>
                <Input
                  id="phone_number"
                  type="tel"
                  value={formData.phone_number?.replace(countryCode, '').trim() || ''}
                  onChange={(e) => {
                    const phoneValue = `${countryCode} ${e.target.value}`;
                    handleInputChange('phone_number', phoneValue);
                  }}
                  placeholder="812-3456-7890"
                  className="flex-1"
                  required
                />
              </div>
            </div>

            {/* 7. Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">
                Email
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@example.com"
                required
              />
            </div>

            {/* 8. LinkedIn Link */}
            <div className="grid gap-2">
              <Label htmlFor="linkedin_link">
                Link LinkedIn
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="linkedin_link"
                type="url"
                value={formData.linkedin_link || ''}
                onChange={(e) => handleInputChange('linkedin_link', e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                required
              />
            </div>

            <div className="flex flex-col space-y-4 pt-6">
              {uploadProgress && (
                <p className="text-sm text-muted-foreground">{uploadProgress}</p>
              )}
              <div className="flex space-x-4">
                <Button type="submit" disabled={isSubmitting}>
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Cancel</Link>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {showWebcam && (
        <WebcamCapture
          onCapture={handleWebcamCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}
    </div>
  );
}