'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, TrendingUp, Calendar } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Job, Candidate } from '@/types';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  // Redirect applicants to jobs page
  useEffect(() => {
    if (user?.role === 'applicant') {
      router.push('/jobs');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, candidatesData] = await Promise.all([
          api.getJobs().catch(() => ({ data: [] })),
          api.getCandidates().catch(() => ({ data: [] }))
        ]);
        // Backend returns { data: [...], config: {...} } for jobs
        setJobs(jobsData.data || []);
        setCandidates(candidatesData.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: 'Total Jobs',
      value: jobs.length.toString(),
      icon: Briefcase,
      description: 'Active job postings',
    },
    {
      title: 'Total Candidates',
      value: candidates.length.toString(),
      icon: Users,
      description: 'Registered candidates',
    },
    {
      title: 'Active Jobs',
      value: jobs.filter(job => job.status === 'active').length.toString(),
      icon: TrendingUp,
      description: 'Currently hiring',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Hiring management dashboard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Latest job postings</CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No jobs available</p>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div>
                      <Link href='#' className="hover:underline">
                        <p className="font-medium">{job.title}</p>
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {job.salary_range?.display_text || 'Salary not specified'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                        {job.list_card?.badge || job.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/jobs">View All Jobs</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Candidates</CardTitle>
            <CardDescription>Latest candidate applications</CardDescription>
          </CardHeader>
          <CardContent>
            {candidates.length === 0 ? (
              <p className="text-muted-foreground text-sm">No candidates available</p>
            ) : (
              <div className="space-y-3">
                {candidates.slice(0, 3).map((candidate) => {
                  const name = candidate.attributes.find(attr => attr.key === 'full_name')?.value || 'Unknown';
                  const email = candidate.attributes.find(attr => attr.key === 'email')?.value || '';
                  return (
                    <div key={candidate.id}>
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
