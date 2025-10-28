'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import type { Job } from '@/types';

interface EditJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onSuccess?: () => void;
}

export function EditJobModal({ open, onOpenChange, job, onSuccess }: EditJobModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    job_type: 'full-time',
    description: '',
    num_candidates: '',
    status: 'active',
    salary_min: '',
    salary_max: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        job_type: (job as any).job_type || 'full-time',
        description: (job as any).description || '',
        num_candidates: (job as any).num_candidates?.toString() || '1',
        status: job.status || 'active',
        salary_min: job.salary_range?.min?.toString() || '',
        salary_max: job.salary_range?.max?.toString() || '',
      });
    }
  }, [job]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    setIsSubmitting(true);
    setError('');

    try {
      const jobData = {
        title: formData.title,
        job_type: formData.job_type,
        description: formData.description,
        num_candidates: parseInt(formData.num_candidates) || 1,
        status: formData.status,
        salary_range: {
          min: parseInt(formData.salary_min) || 0,
          max: parseInt(formData.salary_max) || 0,
          display_text: `Rp ${parseInt(formData.salary_min).toLocaleString('id-ID')} - Rp ${parseInt(formData.salary_max).toLocaleString('id-ID')}`,
        },
        list_card: {
          badge: formData.status === 'active' ? 'Open' : 'Closed',
          started_on_text: job.list_card?.started_on_text || 'Recently updated',
        },
      };

      await api.updateJob(job.id, jobData);
      
      alert('Job updated successfully!');
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
      // Reset form
      setFormData({
        title: '',
        job_type: 'full-time',
        description: '',
        num_candidates: '',
        status: 'active',
        salary_min: '',
        salary_max: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
          <DialogDescription>
            Update job posting details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-title">Job Name</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Senior Frontend Developer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-job-type">Job Type</Label>
            <Select 
              value={formData.job_type} 
              onValueChange={(value) => setFormData({ ...formData, job_type: value })}
            >
              <SelectTrigger id="edit-job-type">
                <SelectValue placeholder="Select job type" />
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

          <div className="space-y-2">
            <Label htmlFor="edit-description">Job Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the role, responsibilities, and requirements..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-num-candidates">Number of Candidates Needed</Label>
            <Input
              id="edit-num-candidates"
              type="number"
              min="1"
              value={formData.num_candidates}
              onChange={(e) => setFormData({ ...formData, num_candidates: e.target.value })}
              placeholder="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="edit-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-salary-min">Min Estimated Salary (Rp)</Label>
              <Input
                id="edit-salary-min"
                type="number"
                value={formData.salary_min}
                onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                placeholder="5000000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-salary-max">Max Estimated Salary (Rp)</Label>
              <Input
                id="edit-salary-max"
                type="number"
                value={formData.salary_max}
                onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                placeholder="10000000"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
