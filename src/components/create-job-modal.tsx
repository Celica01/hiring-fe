'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// Available fields for application form
const AVAILABLE_FIELDS = [
  { key: 'full_name', label: 'Full Name', description: 'Applicant\'s full legal name' },
  { key: 'photo_profile', label: 'Photo Profile', description: 'Profile photo upload' },
  { key: 'gender', label: 'Gender', description: 'Gender selection' },
  { key: 'domicile', label: 'Domicile', description: 'Current living location' },
  { key: 'email', label: 'Email', description: 'Contact email address' },
  { key: 'phone_number', label: 'Phone Number', description: 'Contact phone number' },
  { key: 'linkedin_link', label: 'LinkedIn Link', description: 'LinkedIn profile URL' },
  { key: 'date_of_birth', label: 'Date of Birth', description: 'Date of birth' }
];

type FieldRequirement = 'mandatory' | 'optional' | 'off';

interface CreateJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateJobModal({ open, onOpenChange }: CreateJobModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    job_type: 'full-time',
    description: '',
    num_candidates: '',
    min_salary: '',
    max_salary: '',
    currency: 'IDR',
    status: 'active'
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
        job_type: formData.job_type,
        description: formData.description,
        num_candidates: parseInt(formData.num_candidates) || 1,
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
      
      // Reset form and close modal
      setFormData({
        title: '',
        slug: '',
        job_type: 'full-time',
        description: '',
        num_candidates: '',
        min_salary: '',
        max_salary: '',
        currency: 'IDR',
        status: 'active'
      });
      setFieldConfig({
        full_name: 'mandatory',
        photo_profile: 'mandatory',
        gender: 'mandatory',
        domicile: 'optional',
        email: 'mandatory',
        phone_number: 'mandatory',
        linkedin_link: 'mandatory',
        date_of_birth: 'optional'
      });
      onOpenChange(false);
      
      // Refresh the page
      router.refresh();
    } catch (error) {
      console.error('Failed to create job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>
            Fill in the job information and configure application requirements
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Job Name</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g. Senior Frontend Developer"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="job_type">Job Type</Label>
                <Select value={formData.job_type} onValueChange={(value) => handleInputChange('job_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="num_candidates">Number of Candidates Needed</Label>
                <Input
                  id="num_candidates"
                  type="number"
                  min="1"
                  value={formData.num_candidates}
                  onChange={(e) => handleInputChange('num_candidates', e.target.value)}
                  placeholder="1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="min_salary">Minimum Estimated Salary</Label>
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
                  <Label htmlFor="max_salary">Maximum Estimated Salary</Label>
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

              {/* Minimum Profile Information Required Section */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h4 className="font-medium mb-2">Minimum Profile Information Required</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure which fields applicants must fill when applying for this job.
                  </p>
                </div>
                
                <div className="space-y-3">
                  {AVAILABLE_FIELDS.map((field) => (
                    <div key={field.key} className="p-4 border rounded-lg space-y-3">
                      <div>
                        <Label className="font-medium">{field.label}</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {field.description}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={fieldConfig[field.key] === 'mandatory' ? 'default' : 'outline'}
                          className={cn(
                            fieldConfig[field.key] === 'mandatory' && 'bg-red-600 hover:bg-red-700 text-white'
                          )}
                          onClick={() => handleFieldConfigChange(field.key, 'mandatory')}
                        >
                          Mandatory
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={fieldConfig[field.key] === 'optional' ? 'default' : 'outline'}
                          className={cn(
                            fieldConfig[field.key] === 'optional' && 'bg-blue-600 hover:bg-blue-700 text-white'
                          )}
                          onClick={() => handleFieldConfigChange(field.key, 'optional')}
                        >
                          Optional
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={fieldConfig[field.key] === 'off' ? 'default' : 'outline'}
                          className={cn(
                            fieldConfig[field.key] === 'off' && 'bg-gray-600 hover:bg-gray-700 text-white'
                          )}
                          onClick={() => handleFieldConfigChange(field.key, 'off')}
                        >
                          Off
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
