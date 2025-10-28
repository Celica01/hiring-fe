'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

// Available fields for application form
const AVAILABLE_FIELDS = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'photo_profile', label: 'Photo Profile' },
  { key: 'gender', label: 'Gender' },
  { key: 'domicile', label: 'Domicile' },
  { key: 'email', label: 'Email' },
  { key: 'phone_number', label: 'Phone Number' },
  { key: 'linkedin_link', label: 'LinkedIn Link' },
  { key: 'date_of_birth', label: 'Date of Birth' }
];

type FieldRequirement = 'mandatory' | 'optional' | 'off';

export default function NewJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Only admin can create jobs
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/jobs');
    }
  }, [user, router]);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    status: 'active',
    min_salary: '',
    max_salary: '',
    currency: 'IDR',
    description: ''
  });

  // Initialize field configuration with default values
  const [fieldConfig, setFieldConfig] = useState<Record<string, FieldRequirement>>({
    full_name: 'mandatory',
    photo_profile: 'mandatory',
    gender: 'mandatory',
    domicile: 'optional',
    email: 'mandatory',
    phone_number: 'mandatory',
    linkedin_link: 'mandatory',
    date_of_birth: 'optional'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }
  };

  const handleFieldConfigChange = (fieldKey: string, requirement: FieldRequirement) => {
    setFieldConfig(prev => ({
      ...prev,
      [fieldKey]: requirement
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Generate job ID
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const jobId = `job_${dateStr}_${randomNum}`;
      
      // Format date for display
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const startedOnText = `started on ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
      
      // Build application form configuration
      const applicationFormFields = AVAILABLE_FIELDS
        .filter(field => fieldConfig[field.key] !== 'off')
        .map(field => ({
          key: field.key,
          validation: {
            required: fieldConfig[field.key] === 'mandatory'
          }
        }));

      const jobData = {
        id: jobId,
        title: formData.title,
        slug: formData.slug,
        status: formData.status,
        salary_range: {
          min: parseInt(formData.min_salary),
          max: parseInt(formData.max_salary),
          currency: formData.currency,
          display_text: `${formData.currency === 'IDR' ? 'Rp' : '$'}${parseInt(formData.min_salary).toLocaleString()} - ${formData.currency === 'IDR' ? 'Rp' : '$'}${parseInt(formData.max_salary).toLocaleString()}`
        },
        list_card: {
          badge: formData.status === 'active' ? 'Active' : formData.status === 'inactive' ? 'Inactive' : 'Draft',
          started_on_text: startedOnText,
          cta: 'Manage Job'
        },
        description: formData.description,
        application_form: {
          sections: [
            {
              title: 'Profile Information',
              fields: applicationFormFields
            }
          ]
        }
      };

      await api.createJob(jobData);
      router.push('/jobs');
    } catch (error) {
      console.error('Failed to create job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Job</h1>
          <p className="text-muted-foreground">
            Add a new job posting to your hiring pipeline.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Fill in the information for your new job posting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g. Senior Frontend Developer"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="e.g. senior-frontend-developer"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="min_salary">Minimum Salary</Label>
                  <Input
                    id="min_salary"
                    type="number"
                    value={formData.min_salary}
                    onChange={(e) => handleInputChange('min_salary', e.target.value)}
                    placeholder="7000000"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max_salary">Maximum Salary</Label>
                  <Input
                    id="max_salary"
                    type="number"
                    value={formData.max_salary}
                    onChange={(e) => handleInputChange('max_salary', e.target.value)}
                    placeholder="10000000"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">Indonesian Rupiah (IDR)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the job role, requirements, and responsibilities..."
                  rows={5}
                />
              </div>
            </div>

            {/* Application Form Configuration */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Application Form Fields</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure which fields applicants need to fill when applying for this job.
              </p>
              
              <div className="space-y-3">
                {AVAILABLE_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <Label className="font-medium">{field.label}</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {field.key === 'full_name' && 'Applicant\'s full legal name'}
                        {field.key === 'photo_profile' && 'Profile photo upload'}
                        {field.key === 'gender' && 'Gender selection'}
                        {field.key === 'domicile' && 'Current living location'}
                        {field.key === 'email' && 'Contact email address'}
                        {field.key === 'phone_number' && 'Contact phone number'}
                        {field.key === 'linkedin_link' && 'LinkedIn profile URL'}
                        {field.key === 'date_of_birth' && 'Date of birth'}
                      </p>
                    </div>
                    <Select 
                      value={fieldConfig[field.key]} 
                      onValueChange={(value) => handleFieldConfigChange(field.key, value as FieldRequirement)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mandatory">
                          <span className="text-red-600 font-medium">Mandatory</span>
                        </SelectItem>
                        <SelectItem value="optional">
                          <span className="text-blue-600 font-medium">Optional</span>
                        </SelectItem>
                        <SelectItem value="off">
                          <span className="text-gray-500">Off</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Creating...' : 'Create Job'}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/jobs">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}