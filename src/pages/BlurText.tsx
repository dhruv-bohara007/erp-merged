import { motion, Transition } from 'framer-motion';
import { useEffect, useRef, useState, useMemo } from 'react';

type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Record<string, string | number>;
  animationTo?: Array<Record<string, string | number>>;
  easing?: (t: number) => number;
  onAnimationComplete?: () => void;
  stepDuration?: number;
  // NEW PROPS FOR HOVER EFFECT
  hoverScale?: number;
  hoverColor?: string;
  hoverTransition?: Transition; // Allow custom hover transition
};

interface CustomTransition extends Omit<Transition, 'ease'> {
  ease?: (t: number) => number;
}

const buildKeyframes = (
  from: Record<string, string | number>,
  steps: Array<Record<string, string | number>>
): Record<string, Array<string | number>> => {
  const keys = new Set<string>([
    ...Object.keys(from),
    ...steps.flatMap((s) => Object.keys(s)),
  ]);

  const keyframes: Record<string, Array<string | number>> = {};
  keys.forEach((k) => {
    keyframes[k] = [from[k], ...steps.map((s) => s[k])];
  });
  return keyframes;
};

const BlurText: React.FC<BlurTextProps> = ({
  text = '',
  delay = 200,
  className = '',
  style = {},
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = (t) => t,
  onAnimationComplete,
  stepDuration = 0.35,
  // NEW HOVER PROPS
  hoverScale = 1.03, // Default scale on hover
  hoverColor, // Default color on hover
  hoverTransition = { duration: 0.2, ease: "easeOut" }, // Default transition on hover
}) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current as Element);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom = useMemo(
    () =>
      direction === 'top'
        ? { filter: 'blur(10px)', opacity: 0, y: -50 }
        : { filter: 'blur(10px)', opacity: 0, y: 50 },
    [direction]
  );

  const defaultTo = useMemo(
    () => [
      {
        filter: 'blur(5px)',
        opacity: 0.5,
        y: direction === 'top' ? 5 : -5,
      },
      { filter: 'blur(0px)', opacity: 1, y: 0 },
    ],
    [direction]
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) =>
    stepCount === 1 ? 0 : i / (stepCount - 1)
  );

  // Define the base variants for each segment
  const segmentVariants = {
    hidden: fromSnapshot,
    visible: (i: number) => ({
      // Use buildKeyframes directly here
      ...buildKeyframes(fromSnapshot, toSnapshots),
      transition: {
        duration: totalDuration,
        times,
        ease: easing,
        delay: (i * delay) / 1000, // Apply individual delay directly in the variant
      },
    }),
    // Define the 'hover' variant for framer-motion
    hover: {
      scale: hoverScale,
      color: hoverColor || style.color, // Use hoverColor if provided, otherwise original
      transition: hoverTransition,
    }
  };

  return (
    <p
      ref={ref}
      className={className}
      style={{ display: 'flex', flexWrap: 'wrap', ...style }}
    >
      {elements.map((segment, index) => {
        return (
          <motion.span
            key={index}
            initial="hidden" // Set initial state to 'hidden' variant
            // Pass custom={index} for the 'visible' variant to use for stagger delay
            animate={inView ? "visible" : "hidden"}
            custom={index}
            variants={segmentVariants} // Use the defined variants
            whileHover="hover" // Apply the 'hover' variant on hover
            onAnimationComplete={
              index === elements.length - 1 && inView ? onAnimationComplete : undefined
            }
            style={{
              display: 'inline-block',
              willChange: 'transform, filter, opacity, color',
              // Add non-breaking space for word spacing if animateBy is 'words'
              marginRight: animateBy === 'words' && segment !== '' && index < elements.length -1 ? '0.25em' : '0em',
            }}
          >
            {/* Render a non-breaking space for actual spaces */}
            {segment === ' ' ? '\u00A0' : segment}
          </motion.span>
        );
      })}
    </p>
  );
};

export default BlurText;