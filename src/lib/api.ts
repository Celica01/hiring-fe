const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = {
  async login(email: string, password: string, role: string) {
    try {
      console.log('Attempting login with:', { email, role });
      console.log('API URL:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Login failed' }));
        console.error('Login error:', error);
        throw new Error(error.error || 'Login failed');
      }
      
      const data = await response.json();
      console.log('Login success:', data);
      return data;
    } catch (error) {
      console.error('Login exception:', error);
      throw error;
    }
  },

  async getCandidates() {
    const response = await fetch(`${API_BASE_URL}/candidates`);
    if (!response.ok) throw new Error('Failed to fetch candidates');
    return response.json();
  },

  async getJobs() {
    const response = await fetch(`${API_BASE_URL}/jobs`);
    if (!response.ok) throw new Error('Failed to fetch jobs');
    return response.json();
  },

  async getJobConfig() {
    const response = await fetch(`${API_BASE_URL}/job-config`);
    if (!response.ok) throw new Error('Failed to fetch job config');
    return response.json();
  },

  async createCandidate(candidateData: any) {
    const response = await fetch(`${API_BASE_URL}/candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(candidateData),
    });
    if (!response.ok) throw new Error('Failed to create candidate');
    return response.json();
  },

  async createJob(jobData: any) {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });
    if (!response.ok) throw new Error('Failed to create job');
    return response.json();
  },

  async updateJob(jobId: string, jobData: any) {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });
    if (!response.ok) throw new Error('Failed to update job');
    return response.json();
  },

  async deleteJob(jobId: string) {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete job');
    return response.json();
  },

  async uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Failed to upload photo');
    return response.json();
  },
};