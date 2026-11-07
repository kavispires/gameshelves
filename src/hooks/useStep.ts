import { useState } from 'react';

/**
 * Controls steps
 * @param startingStep
 */
export function useStep(startingStep = 0): {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
} {
  const [step, setStep] = useState<number>(startingStep);

  const goToNextStep = () => setStep((s) => s + 1);

  const goToPreviousStep = () => setStep((s) => Math.max(0, s - 1));

  return {
    step,
    setStep,
    goToNextStep,
    goToPreviousStep,
  };
}
