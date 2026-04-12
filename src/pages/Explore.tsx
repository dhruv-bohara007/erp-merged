import React from 'react';
import { ScrollVelocity } from './ScrollVelocity'; // Adjust path as needed
import './Explore.css'; // Link to its dedicated CSS file

interface ExploreProps {
  title?: string;
}

const Explore: React.FC<ExploreProps> = ({ title }) => {
  const textsToDisplay = ['● Explore Our InvoiceApp'];
  // Reverting velocity to a moderate speed for idle scrolling
  const velocityValue = 50; // Use 50 for the original, less fast idle scrolling

  return (
    <>
      <section id="explore" className="explore-section">
        <div className="explore-content">
          {title && <h2>{title}</h2>}
        </div>
        <ScrollVelocity
          texts={textsToDisplay}
          velocity={velocityValue}
          className="explore-scroll-text"
          // Ensure numCopies is not explicitly set to a very low number here
          // If you *were* setting numCopies, remove it or set it high enough, e.g., numCopies={6}
          // The default behavior of ScrollVelocity should handle repetition.
        />
      </section>
      <section className="explore-black-background">
        {/* Content for the black section below */}
      </section>
    </>
  );
};

export default Explore;