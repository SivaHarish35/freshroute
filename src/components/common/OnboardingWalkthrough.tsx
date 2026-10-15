import React from "react";
import { useOnboarding, ONBOARDING_STEPS } from "../../context/OnboardingContext";
import { ChevronRightIcon, ChevronLeftIcon, XIcon, CheckIcon, ShieldCheckIcon } from "./Icons";

export const OnboardingWalkthrough: React.FC = () => {
  const { isActive, currentStepIndex, currentStep, nextStep, prevStep, skipTour, finishTour } = useOnboarding();

  if (!isActive) return null;

  const isLast = currentStepIndex === ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-[var(--bg-card)] border-2 border-[var(--primary-gold)] rounded-2xl shadow-2xl p-5 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--primary-gold)]">
          <ShieldCheckIcon className="w-4 h-4" />
          Interactive Onboarding Walkthrough
        </div>
        <button onClick={skipTour} className="text-[var(--text-secondary)] hover:text-[var(--text-main)] p-1">
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      <h4 className="text-base font-bold text-[var(--text-main)] mb-0.5">
        {currentStep.title}
      </h4>
      <p className="text-xs font-medium text-[var(--primary-gold)] mb-2">
        {currentStep.tagline}
      </p>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
        {currentStep.description}
      </p>

      {/* Progress Dots & Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-1.5">
          {ONBOARDING_STEPS.map((_, idx) => (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStepIndex
                  ? "w-5 bg-[var(--primary-gold)]"
                  : (idx < currentStepIndex ? "bg-[var(--fresh-green)]" : "bg-gray-300 dark:bg-gray-700")
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {currentStepIndex > 0 && (
            <button
              onClick={prevStep}
              className="p-1.5 text-xs text-[var(--text-secondary)] hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg flex items-center gap-1"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" /> Back
            </button>
          )}

          <button
            onClick={isLast ? finishTour : nextStep}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[var(--primary-gold)] hover:opacity-90 text-white flex items-center gap-1"
          >
            {isLast ? "Finish Tour" : "Next"}
            {isLast ? <CheckIcon className="w-3.5 h-3.5" /> : <ChevronRightIcon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
