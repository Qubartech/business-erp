import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { timeApi } from "@/services/featureApis";
import type { TimeEntry } from "@/types";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/features/auth/AuthProvider";

type TimeTrackerState = {
  currentTimer: TimeEntry | null;
  isLoading: boolean;
  isTimerActionPending: boolean;
  startTimer: (taskId: string) => void;
  stopTimer: () => void;
  sprintRemaining: number; // in seconds
  completedSprintTask: { taskId: string; title: string } | null;
  setCompletedSprintTask: (task: { taskId: string; title: string } | null) => void;
  startTimerVariables: string | undefined;
};

const TimeTrackerCtx = createContext<TimeTrackerState | null>(null);

export function TimeTrackerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [completedSprintTask, setCompletedSprintTask] = useState<{ taskId: string; title: string } | null>(null);
  
  // Track remaining seconds of the 60-minute sprint
  const [sprintRemaining, setSprintRemaining] = useState<number>(3600);

  // Fetch the current timer for the logged-in user
  const { data: currentTimer, isLoading } = useQuery({
    queryKey: ["time", "current"],
    queryFn: timeApi.current,
    enabled: !!user,
  });

  // Mutators
  const startMut = useMutation({
    mutationFn: (taskId: string) => timeApi.start(taskId),
    onSuccess: () => {
      toast.success("Sprint started");
      qc.invalidateQueries({ queryKey: ["time"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to start timer"),
  });

  const stopMut = useMutation({
    mutationFn: ({ id, endTime }: { id: string; endTime?: string }) => timeApi.stop(id, endTime),
    onSuccess: () => {
      toast.success("Timer stopped");
      qc.invalidateQueries({ queryKey: ["time"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to stop timer"),
  });

  const isTimerActionPending = startMut.isPending || stopMut.isPending;

  const startTimer = (taskId: string) => startMut.mutate(taskId);
  const stopTimer = () => {
    if (currentTimer) {
      stopMut.mutate({ id: currentTimer.id });
    }
  };

  const SPRINT_LIMIT = 60 * 60 * 1000; // 60 minutes in ms

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  // Keep a stable ref to stopMut so the interval effect doesn't re-run when
  // mutation state changes (isPending toggling creates new object references)
  const stopMutRef = useRef(stopMut);
  useEffect(() => { stopMutRef.current = stopMut; }, [stopMut]);

  // Interval check (every second) for Pomodoro sprint limit
  useEffect(() => {
    if (!user || !currentTimer) {
      setSprintRemaining(3600);
      return;
    }

    const timerStartTime = new Date(currentTimer.startTime).getTime();
    // Guard: only fire the sprint-complete action once per interval lifecycle
    let hasFired = false;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - timerStartTime;

      // Pomodoro Sprint limit check (60 minutes)
      if (elapsed >= SPRINT_LIMIT) {
        if (hasFired) return; // already handled — wait for clearInterval
        hasFired = true;
        clearInterval(interval);

        const stopTime = new Date(timerStartTime + SPRINT_LIMIT).toISOString();

        // Auto-pause timer on server
        stopMutRef.current.mutate({ id: currentTimer.id, endTime: stopTime });

        // Save sprint info to prompt user
        setCompletedSprintTask({
          taskId: currentTimer.taskId,
          title: currentTimer.task?.title || "Unknown Task",
        });

        // Trigger native notification — only once
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Sprint Completed!", {
            body: `Your 60-minute sprint has ended on: ${currentTimer.task?.title ?? "Task"}. Are you still working?`,
            requireInteraction: true,
          });
        }
        return;
      }

      // Update remaining countdown seconds
      const secondsLeft = Math.max(0, Math.floor((SPRINT_LIMIT - elapsed) / 1000));
      setSprintRemaining(secondsLeft);
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentTimer, SPRINT_LIMIT]); // ← stopMut intentionally excluded; using stopMutRef instead

  return (
    <TimeTrackerCtx.Provider
      value={{
        currentTimer: currentTimer || null,
        isLoading,
        isTimerActionPending,
        startTimer,
        stopTimer,
        sprintRemaining,
        completedSprintTask,
        setCompletedSprintTask,
        startTimerVariables: startMut.variables,
      }}
    >
      {children}

      {/* Sprint Completion Confirmation Dialog */}
      <Modal
        open={completedSprintTask !== null}
        onClose={() => setCompletedSprintTask(null)}
        title="Sprint Completed"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCompletedSprintTask(null)}>
              No, pause
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                if (completedSprintTask) {
                  startTimer(completedSprintTask.taskId);
                  setCompletedSprintTask(null);
                }
              }}
            >
              Yes, start next sprint
            </button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Your 60-minute sprint has ended.</p>
          <p>
            You were working on: <strong className="text-brand-700">{completedSprintTask?.title}</strong>.
          </p>
          <p>Would you like to start another 60-minute sprint block for this task?</p>
        </div>
      </Modal>
    </TimeTrackerCtx.Provider>
  );
}

export function useTimeTracker() {
  const ctx = useContext(TimeTrackerCtx);
  if (!ctx) throw new Error("useTimeTracker must be used inside TimeTrackerProvider");
  return ctx;
}
