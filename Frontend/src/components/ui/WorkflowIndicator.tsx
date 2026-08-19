import { workflowSteps } from '@/config/navigation';

interface WorkflowIndicatorProps {
  current: string;
  onNavigate?: (page: string) => void;
}

export function WorkflowIndicator({ current, onNavigate }: WorkflowIndicatorProps) {
  const currentIndex = workflowSteps.findIndex((s) => s.id === current);

  return (
    <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1 select-none">
      {workflowSteps.map((step, i) => {
        const isCurrent = step.id === current;
        const isComplete = i < currentIndex;
        return (
          <div key={step.id} className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onNavigate?.(step.page)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded text-xs font-medium transition-all duration-150 ${
                isCurrent
                  ? 'bg-blue-50 text-accent font-semibold border border-blue-200 shadow-subtle'
                  : isComplete
                  ? 'text-emerald-700 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-2xs font-semibold ${
                  isCurrent
                    ? 'bg-accent text-white'
                    : isComplete
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isComplete ? '✓' : i + 1}
              </span>
              <span>{step.label}</span>
            </button>
            {i < workflowSteps.length - 1 && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-300 shrink-0"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
