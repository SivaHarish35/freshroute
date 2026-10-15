import React, { createContext, useContext, useState } from "react";
import { useAuth } from "./AuthContext";

export interface OnboardingStep {
  id: number;
  title: string;
  tagline: string;
  description: string;
  targetPage: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "1. Perishable Inventory",
    tagline: "Track Shelf-Life & Real-Time Risk",
    description: "Inspect inventory batches with exact shelf-life hours remaining, origin warehouses, storage temperatures, and calculated risk states (Healthy, At-Risk, Critical-Risk).",
    targetPage: "inventory"
  },
  {
    id: 2,
    title: "2. Regional Markets & Demand",
    tagline: "Demand, Prices & Logistics Constraints",
    description: "Manage destination receiving capacities, commodity-specific demand levels, prevailing market prices, and origin-to-destination transit routes.",
    targetPage: "destinations"
  },
  {
    id: 3,
    title: "3. Optimization Center",
    tagline: "Google OR-Tools MIP vs. Fair Baseline",
    description: "Formulate and solve the constrained allocation problem. The engine enforces hard perishability (Transit + Handling <= Shelf Life) and compares against the Earliest-Expiry-First benchmark.",
    targetPage: "optimization"
  },
  {
    id: 4,
    title: "4. Explainable Allocations",
    tagline: "Transparent 'Why this allocation?' Insights",
    description: "Every dispatch comes with deep explainability: transit safety margins, demand fulfillment contribution, transport costs, and dynamic natural-language reasoning.",
    targetPage: "optimization"
  },
  {
    id: 5,
    title: "5. Analytics & Food-Waste Impact",
    tagline: "Measurable Spoilage Avoidance",
    description: "Review net revenue improvements, demand fulfillment percentage, and exact kilograms of food waste avoided using identical starting conditions.",
    targetPage: "reports"
  },
  {
    id: 6,
    title: "6. What-If Scenario Simulator",
    tagline: "Stress-Test Logistics Under Disruption",
    description: "Simulate highway delays, holiday demand surges, and reefer truck capacity shortages. Observe how allocations and spoilage dynamically shift in real-time.",
    targetPage: "scenarios"
  }
];

interface OnboardingContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: OnboardingStep;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  finishTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{
  children: React.ReactNode;
  setCurrentPage: (page: string) => void;
}> = ({ children, setCurrentPage }) => {
  const { user, updateOnboardingStatus } = useAuth();
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Auto-prompt onboarding if user hasn't completed it
  React.useEffect(() => {
    if (user && !user.has_completed_onboarding) {
      setIsActive(true);
      setCurrentStepIndex(0);
      setCurrentPage(ONBOARDING_STEPS[0].targetPage);
    }
  }, [user]);

  const startTour = () => {
    setCurrentStepIndex(0);
    setIsActive(true);
    setCurrentPage(ONBOARDING_STEPS[0].targetPage);
  };

  const nextStep = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setCurrentPage(ONBOARDING_STEPS[nextIdx].targetPage);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      setCurrentPage(ONBOARDING_STEPS[prevIdx].targetPage);
    }
  };

  const skipTour = () => {
    setIsActive(false);
    updateOnboardingStatus(true);
  };

  const finishTour = () => {
    setIsActive(false);
    updateOnboardingStatus(true);
  };

  return (
    <OnboardingContext.Provider value={{
      isActive,
      currentStepIndex,
      currentStep: ONBOARDING_STEPS[currentStepIndex],
      startTour,
      nextStep,
      prevStep,
      skipTour,
      finishTour
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used within an OnboardingProvider");
  return context;
};
