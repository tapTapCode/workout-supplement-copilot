'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { CopilotRecommendation } from '@workout-copilot/shared';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

function CopilotContent() {
  const searchParams = useSearchParams();
  const workoutId = searchParams.get('workout_id');

  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<CopilotRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userGoals, setUserGoals] = useState<string[]>([]);
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');

  const addGoal = () => {
    if (goalInput.trim() && !userGoals.includes(goalInput.trim())) {
      setUserGoals([...userGoals, goalInput.trim()]);
      setGoalInput('');
    }
  };

  const removeGoal = (goal: string) => {
    setUserGoals(userGoals.filter((g) => g !== goal));
  };

  const addCondition = () => {
    if (conditionInput.trim() && !healthConditions.includes(conditionInput.trim())) {
      setHealthConditions([...healthConditions, conditionInput.trim()]);
      setConditionInput('');
    }
  };

  const removeCondition = (condition: string) => {
    setHealthConditions(healthConditions.filter((c) => c !== condition));
  };

  const handleGetRecommendation = async () => {
    setLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      // Build request payload, only including fields that have values
      const requestPayload: {
        workout_id?: string;
        user_goals?: string[];
        health_conditions?: string[];
      } = {};
      
      if (workoutId) {
        requestPayload.workout_id = workoutId;
      }
      
      if (userGoals.length > 0) {
        requestPayload.user_goals = userGoals;
      }
      
      if (healthConditions.length > 0) {
        requestPayload.health_conditions = healthConditions;
      }
      
      const response = await apiClient.getRecommendation(requestPayload);

      if (response.error) {
        // Show detailed error message if available
        const errorMessage = response.error.message || 'Failed to get recommendation';
        const errorDetails = response.error.details;
        if (errorDetails) {
          setError(`${errorMessage}\n\nDetails: ${JSON.stringify(errorDetails, null, 2)}`);
        } else {
          setError(errorMessage);
        }
      } else if (response.data) {
        // Handle nested response structure
        interface RecommendationResponse {
          data?: {
            recommendation?: CopilotRecommendation;
          };
          recommendation?: CopilotRecommendation;
        }
        const recommendationResponse = response.data as RecommendationResponse;
        const recommendationData = recommendationResponse.data || response.data;
        const recommendation = recommendationData?.recommendation || recommendationData;
        if (recommendation) {
          setRecommendation(recommendation);
        } else {
          setError('Recommendation data not found in response');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/">← Back to workouts</Link>
        </Button>
        <h1 className="text-3xl font-bold">Supplement Copilot</h1>
        <p className="text-muted-foreground mt-2">
          Get AI-powered supplement recommendations with FDA compliance checking
        </p>
      </div>

      {workoutId && (
        <Alert className="mb-6">
          <AlertDescription>
            Recommendations will be based on your workout. You can also add goals and health
            conditions below.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-2">
            <Label>Fitness Goals</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                placeholder="e.g., Build muscle, Lose weight"
                className="flex-1"
              />
              <Button type="button" onClick={addGoal}>
                Add
              </Button>
            </div>
            {userGoals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {userGoals.map((goal) => (
                  <Badge key={goal} variant="secondary" className="gap-1">
                    {goal}
                    <button
                      type="button"
                      onClick={() => removeGoal(goal)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Health Conditions (optional)</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                placeholder="e.g., High blood pressure, Diabetes"
                className="flex-1"
              />
              <Button type="button" variant="secondary" onClick={addCondition}>
                Add
              </Button>
            </div>
            {healthConditions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {healthConditions.map((condition) => (
                  <Badge key={condition} variant="outline" className="gap-1">
                    {condition}
                    <button
                      type="button"
                      onClick={() => removeCondition(condition)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleGetRecommendation}
            disabled={loading || (!workoutId && userGoals.length === 0)}
            className="w-full"
            size="lg"
          >
            {loading ? 'Getting Recommendations...' : 'Get Supplement Recommendations'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {recommendation && (
        <Card>
          <CardHeader>
            <CardTitle>Your Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Recommendation</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{recommendation.recommendation_text}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Reasoning</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{recommendation.reasoning}</p>
            </div>

            {recommendation.citations && recommendation.citations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Compliance Citations</h3>
                <div className="space-y-3">
                  {recommendation.citations.map((citation, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <p className="font-medium text-sm mb-2">{citation.ingredient_name}</p>
                        <p className="text-sm text-muted-foreground mb-2">{citation.citation_text}</p>
                        {citation.source_url && (
                          <Button variant="link" size="sm" asChild>
                            <a
                              href={citation.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Source
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CopilotPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <CopilotContent />
    </Suspense>
  );
}

