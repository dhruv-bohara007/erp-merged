
import { createContext, useContext, useState, ReactNode } from 'react';

interface SampleDataContextType {
  showSampleData: boolean;
  toggleSampleData: () => void;
}

const SampleDataContext = createContext<SampleDataContextType | undefined>(undefined);

export const SampleDataProvider = ({ children }: { children: ReactNode }) => {
  const [showSampleData, setShowSampleData] = useState(false);

  const toggleSampleData = () => {
    setShowSampleData(prev => !prev);
  };

  return (
    <SampleDataContext.Provider value={{ showSampleData, toggleSampleData }}>
      {children}
    </SampleDataContext.Provider>
  );
};

export const useSampleData = () => {
  const context = useContext(SampleDataContext);
  if (context === undefined) {
    throw new Error('useSampleData must be used within a SampleDataProvider');
  }
  return context;
};
