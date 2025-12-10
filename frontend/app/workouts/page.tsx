import WorkoutList from '../components/WorkoutList';
import { Navigation } from '../components/Navigation';

export default function WorkoutsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <WorkoutList />
      </main>
    </div>
  );
}

