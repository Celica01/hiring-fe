'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Edit, Trash2, Briefcase, Send, X, Users } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { CreateJobModal } from '@/components/create-job-modal';
import { EditJobModal } from '@/components/edit-job-modal';
import type { Job } from '@/types';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  
  const isAdmin = user?.role === 'admin';
  const isApplicant = user?.role === 'applicant';

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.getJobs().catch(() => ({ data: [] }));
      // Backend returns { data: [...], config: {...} }
      let jobsData = response.data || [];
      
      // Filter jobs for applicants - only show active jobs
      if (isApplicant) {
        jobsData = jobsData.filter((job: Job) => job.status === 'active');
      }
      
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setIsEditModalOpen(true);
  };

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteJob(jobId);
      await fetchJobs();
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
      }
      alert('Job deleted successfully!');
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job. Please try again.');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary'; 
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Manage your job postings and hiring processes.' : 'Browse and apply for available positions.'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        )}
      </div>

      {isAdmin && (
        <>
          <CreateJobModal 
            open={isCreateModalOpen} 
            onOpenChange={(open) => {
              setIsCreateModalOpen(open);
              if (!open) {
                fetchJobs();
              }
            }} 
          />
          <EditJobModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            job={editingJob}
            onSuccess={() => {
              fetchJobs();
              setEditingJob(null);
            }}
          />
        </>
      )}

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No jobs found</h3>
            <p className="text-muted-foreground text-center mb-6">
              {isAdmin ? 'Get started by creating your first job posting.' : 'No job openings available at the moment.'}
            </p>
            {isAdmin && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Job
              </Button>
            )}
          </CardContent>
        </Card>
      ) : isApplicant ? (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 p-1">
            {jobs.map((job) => (
              <Card 
                key={job.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedJob(job)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <CardDescription className="mt-1 text-sm">
                        {job.salary_range?.display_text || 'Salary not specified'}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={getStatusBadgeVariant(job.status)}
                      className="ml-2"
                    >
                      {getStatusLabel(job.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {job.list_card?.started_on_text || 'Recently added'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Right side - Job Detail */}
          <div className="col-span-7">
            {selectedJob ? (
              <Card className="sticky top-4 mx-3">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-2xl">{selectedJob.title}</CardTitle>
                        <Badge 
                          variant={getStatusBadgeVariant(selectedJob.status)}
                        >
                          {getStatusLabel(selectedJob.status)}
                        </Badge>
                      </div>
                      <CardDescription className="text-base">
                        {selectedJob.salary_range?.display_text || 'Salary not specified'}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedJob(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Job Description</h3>
                    <p className="text-muted-foreground text-sm whitespace-pre-line">
                      {selectedJob.description || 'No description available'}
                    </p>
                  </div>

                  {selectedJob.status === 'active' && (
                    <Button 
                      className="w-full" 
                      size="lg"
                      asChild
                    >
                      <Link href={`/apply/${selectedJob.slug}`}>
                        <Send className="mr-2 h-4 w-4" />
                        Apply for this Position
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-4 h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Briefcase className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Select a job to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Admin Single Column Layout */
        <div className="grid gap-6">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {job.salary_range?.display_text || 'Salary not specified'}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(job.status)}>
                    {getStatusLabel(job.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {job.list_card?.started_on_text || 'Recently added'}
                  </p>
                  <div className="flex space-x-2">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => router.push(`/candidates?job=${job.id}`)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Job
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditJob(job)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteJob(job.id, job.title)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}