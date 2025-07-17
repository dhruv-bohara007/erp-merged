
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const CompanyDashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Company Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Company Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Dashboard content for {currentUser?.email}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyDashboard;
