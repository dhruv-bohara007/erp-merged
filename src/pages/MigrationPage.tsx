import React from 'react';
import { MigrationUtility } from '@/components/MigrationUtility';

const MigrationPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Database Migration</h1>
        <p className="text-muted-foreground mt-2">
          Migrate expenses collection to purchase_records collection
        </p>
      </div>
      <MigrationUtility />
    </div>
  );
};

export default MigrationPage;