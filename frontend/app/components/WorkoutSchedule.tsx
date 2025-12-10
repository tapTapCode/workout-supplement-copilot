'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { WorkoutSchedule } from '@workout-copilot/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface WorkoutScheduleProps {
  workoutId: string;
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function WorkoutScheduleComponent({ workoutId }: WorkoutScheduleProps) {
  const [schedules, setSchedules] = useState<WorkoutSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday by default
  const [timeOfDay, setTimeOfDay] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  const loadSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getWorkoutSchedules();
      if (response.error) {
        setError(response.error.message);
      } else if (response.data) {
        interface ScheduleResponse {
          data?: {
            schedules?: WorkoutSchedule[];
          };
          schedules?: WorkoutSchedule[];
        }
        const scheduleResponse = response.data as ScheduleResponse;
        const allSchedules = scheduleResponse.data?.schedules || 
                            scheduleResponse.schedules || 
                            [];
        // Filter schedules for this workout
        const workoutSchedules = allSchedules.filter(
          (s: WorkoutSchedule) => s.workout_id === workoutId && s.is_active
        );
        setSchedules(workoutSchedules);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsAdding(true);

    try {
      const response = await apiClient.scheduleWorkout(
        workoutId,
        selectedDay,
        timeOfDay || undefined
      );

      if (response.error) {
        setError(response.error.message);
      } else {
        // Reset form
        setTimeOfDay('');
        setSelectedDay(1);
        // Reload schedules
        await loadSchedules();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule workout');
    } finally {
      setIsAdding(false);
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return 'No time set';
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Workout</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Add Schedule Form */}
        <form onSubmit={handleAddSchedule} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day">Day of Week</Label>
              <select
                id="day"
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time (Optional)</Label>
              <Input
                id="time"
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                placeholder="HH:MM"
              />
            </div>
          </div>

          <Button type="submit" disabled={isAdding} className="w-full">
            {isAdding ? 'Adding...' : 'Add to Schedule'}
          </Button>
        </form>

        {/* Existing Schedules */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading schedules...</p>
        ) : schedules.length > 0 ? (
          <div className="space-y-2">
            <Label>Scheduled Times</Label>
            <div className="space-y-2">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {DAYS_OF_WEEK[schedule.day_of_week]}
                    </Badge>
                    {schedule.time_of_day && (
                      <span className="text-sm text-muted-foreground">
                        {formatTime(schedule.time_of_day)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No schedules yet. Add a day and time above to schedule this workout.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

