'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ApplicationSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mb-6" />
          <h1 className="text-2xl font-bold text-center mb-2">Application Submitted Successfully!</h1>
          <p className="text-muted-foreground text-center mb-8">
            Thank you for your interest in this position. We have received your application 
            and will review it carefully. You will hear from us soon.
          </p>
          
          <div className="flex space-x-4">
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/jobs">
                <FileText className="mr-2 h-4 w-4" />
                Browse More Jobs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}