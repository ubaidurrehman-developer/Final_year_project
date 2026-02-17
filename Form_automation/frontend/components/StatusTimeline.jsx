import React from 'react';
import { Check, Circle, Clock, FileText, UserCheck } from 'lucide-react';

const StatusTimeline = ({ status }) => {
    const steps = [
        { id: 'submitted', label: 'Submitted', icon: FileText },
        { id: 'reviewing', label: 'Under Review', icon: UserCheck },
        { id: 'processed', label: 'Processed', icon: Check },
    ];

    const getCurrentStepIndex = () => {
        if (status === 'Pending') return 1; // Under Review
        if (status === 'Approved' || status === 'Rejected') return 2; // Processed
        return 0; // Submitted
    };

    const currentStepIndex = getCurrentStepIndex();

    return (
        <div className="w-full py-4">
            <div className="relative flex items-center justify-between w-full">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[var(--glass-border)] -z-10" />
                <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-500 transition-all duration-500 -z-10" 
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-[var(--card-bg)] px-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                isCompleted 
                                ? 'bg-primary-500 border-primary-500 text-white' 
                                : 'bg-[var(--card-bg)] border-[var(--glass-border)] text-[var(--text-muted)]'
                            }`}>
                                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                            </div>
                            <span className={`text-xs font-medium ${isCurrent ? 'text-primary-400' : 'text-[var(--text-muted)]'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StatusTimeline;
