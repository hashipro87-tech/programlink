// MealReminderBanner.jsx — Warns kitchen staff if they haven't logged recent meal counts.
// Yellow for missing yesterday, red for 2+ days. Disappears when all caught up.
// Fetches recent entries from the API on mount.

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import api from '../../../services/api';

export default function MealReminderBanner({ onLogNow }) {
  const [missedDays, setMissedDays] = useState(0);
  const [loaded, setLoaded]         = useState(false);

  useEffect(() => {
    // Fetch the last 3 days of meal entries
    // Real endpoint: GET /api/meal-counts?recent=3
    // The mock returns an empty array to simulate missed entries — swap with real call
    const fetchRecent = async () => {
      try {
        const { data } = await api.get('/meal-counts?recent=3');
        const entries = Array.isArray(data) ? data : [];

        // Count consecutive missed days starting from yesterday
        const today = new Date();
        let missed = 0;
        for (let i = 1; i <= 3; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dStr = d.toISOString().split('T')[0];
          if (!entries.find((e) => e.date === dStr)) {
            missed++;
          } else {
            break; // Stop at the first day that has an entry
          }
        }
        setMissedDays(missed);
      } catch {
        // If the endpoint doesn't exist yet, fail silently — don't block the dashboard
      } finally {
        setLoaded(true);
      }
    };

    fetchRecent();
  }, []);

  // Don't render until loaded, and don't render if all caught up
  if (!loaded || missedDays === 0) return null;

  const isRed = missedDays >= 2;

  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border mb-4 ${
      isRed ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
    }`}>
      {isRed
        ? <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
        : <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
      }
      <p className={`flex-1 text-sm font-semibold ${isRed ? 'text-red-700' : 'text-yellow-700'}`}>
        {isRed
          ? `You haven't logged meals in ${missedDays} days — this may affect your compliance standing.`
          : "No meals logged for yesterday. Did you forget?"
        }
      </p>
      <button
        onClick={onLogNow}
        className={`px-4 py-2 text-white text-sm font-semibold rounded-lg flex-shrink-0 transition-colors ${
          isRed ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'
        }`}
      >
        Log Now
      </button>
    </div>
  );
}
