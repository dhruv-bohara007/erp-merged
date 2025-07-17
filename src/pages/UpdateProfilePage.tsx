
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const UpdateProfilePage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Update Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Profile update form for {currentUser?.email}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateProfilePage;
