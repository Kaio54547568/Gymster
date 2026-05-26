import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface PaymentStepperProps {
  currentStep: number;
}

const steps = [
  { id: 1, label: 'Đơn hàng' },
  { id: 2, label: 'Thanh toán' },
  { id: 3, label: 'Xác nhận' },
  { id: 4, label: 'Biên lai' }
];

export const PaymentStepper: React.FC<PaymentStepperProps> = ({ currentStep }) => {
  return (
    <div className="bg-card border border-white/10 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1">
              <div className="flex items-center justify-center w-full mb-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step.id < currentStep
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : step.id === currentStep
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-white/5 border-2 border-white/10'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  ) : step.id === currentStep ? (
                    <Circle className="w-6 h-6 text-primary fill-primary" />
                  ) : (
                    <span className="text-gray-400 font-medium">{step.id}</span>
                  )}
                </div>
              </div>
              <span
                className={`text-sm font-medium ${
                  step.id === currentStep
                    ? 'text-white'
                    : step.id < currentStep
                    ? 'text-green-400'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 -mt-8 ${
                  step.id < currentStep ? 'bg-green-500' : 'bg-white/10'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
