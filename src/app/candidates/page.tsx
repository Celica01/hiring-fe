'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ChevronLeft, ChevronRight, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Candidate, Job } from '@/types';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('job');
  
  // Helper function to get attribute value
  const getAttribute = (candidate: Candidate, key: string) => {
    return candidate.attributes.find(attr => attr.key === key)?.value || '';
  };
  
  // Apply search filter
  const searchFilteredCandidates = searchQuery
    ? filteredCandidates.filter(candidate => {
        const fullName = getAttribute(candidate, 'full_name').toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
      })
    : filteredCandidates;
  
  const itemsPerPage = 10;
  const totalPages = Math.ceil(searchFilteredCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCandidates = searchFilteredCandidates.slice(startIndex, endIndex);

  // Only admin can access candidates page
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/jobs');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [candidatesResponse, jobsResponse] = await Promise.all([
          api.getCandidates().catch(() => ({ data: [] })),
          jobId ? api.getJobs().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
        ]);
        
        const allCandidates = candidatesResponse.data || [];
        setCandidates(allCandidates);
        
        if (jobId && jobsResponse.data) {
          const job = jobsResponse.data.find((j: Job) => j.id === jobId);
          setCurrentJob(job || null);

          // Filter candidates that applied specifically to this job
          const jobCandidates = allCandidates.filter((c: Candidate) => c.job_id === jobId);
          setFilteredCandidates(jobCandidates);
        } else {
          setFilteredCandidates(allCandidates);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [jobId]);

  const handleSelectAll = () => {
    if (selectedCandidates.size === currentCandidates.length) {
      setSelectedCandidates(new Set());
    } else {
      const allIds = new Set(currentCandidates.map(c => c.id));
      setSelectedCandidates(allIds);
    }
  };

  const handleSelectCandidate = (id: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCandidates(newSelected);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    setSelectedCandidates(new Set()); // Clear selection when changing page
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading candidates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          {currentJob && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-2"
              asChild
            >
              <Link href="/jobs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
              </Link>
            </Button>
          )}
          <h1 className="text-3xl font-bold tracking-tight">
            {currentJob ? `Candidates for ${currentJob.title}` : 'All Candidates'}
          </h1>
          <p className="text-muted-foreground">
            {currentJob 
              ? `View and manage candidates who applied for this position.`
              : 'View and manage all candidate applications.'
            }
          </p>
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No candidates found</h3>
            <p className="text-muted-foreground text-center mb-6">
              Candidates will appear here when they apply for your job postings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle>
                  {currentJob ? `Candidates for ${currentJob.title}` : 'All Candidates'} ({searchFilteredCandidates.length})
                </CardTitle>
                <CardDescription>
                  {selectedCandidates.size > 0 && (
                    <span className="text-primary font-medium">
                      {selectedCandidates.size} candidate(s) selected
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search Candidate ..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedCandidates.size === currentCandidates.length && currentCandidates.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Nomor Handphone</TableHead>
                    <TableHead>Tanggal Lahir</TableHead>
                    <TableHead>Domicile</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>LinkedIn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentCandidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchQuery 
                              ? `No candidates found matching "${searchQuery}"`
                              : 'No candidates found'
                            }
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCandidates.has(candidate.id)}
                          onCheckedChange={() => handleSelectCandidate(candidate.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {getAttribute(candidate, 'full_name') || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getAttribute(candidate, 'email') || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getAttribute(candidate, 'phone_number') || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {formatDate(getAttribute(candidate, 'date_of_birth'))}
                      </TableCell>
                      <TableCell>
                        {getAttribute(candidate, 'domicile') || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {getAttribute(candidate, 'gender') || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getAttribute(candidate, 'linkedin_link') ? (
                          <a 
                            href={getAttribute(candidate, 'linkedin_link')} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline underline flex items-center gap-1 max-w-[200px] truncate"
                            title={getAttribute(candidate, 'linkedin_link')}
                          >
                            {getAttribute(candidate, 'linkedin_link')}
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, searchFilteredCandidates.length)} of {searchFilteredCandidates.length} candidates
                  {searchQuery && <span className="ml-1">(filtered by: "{searchQuery}")</span>}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}