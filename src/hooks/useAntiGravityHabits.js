import { useFirestoreCollection, useFirestoreDoc } from './useFirestoreNew';

const DEFAULT_QUOTES = [
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
    { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
    { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" }
];

export function useAntiGravityHabits() {
    const [habits, addHabit, updateHabit, deleteHabit, loading] = useFirestoreCollection('antiGravityHabits');
    
    // Using a doc for global settings like quotes
    const [settings, setSettings, settingsLoading] = useFirestoreDoc('antiGravitySettings/global', {
        quotes: DEFAULT_QUOTES
    });

    const activeHabits = habits.filter(h => !h.isArchived);
    const criticalHabits = activeHabits.filter(h => h.type === 'critical');
    const normalHabits = activeHabits.filter(h => h.type === 'normal');
    const incubatorHabits = activeHabits.filter(h => h.type === 'incubator');
    const archivedHabits = habits.filter(h => h.isArchived);

    return {
        habits,
        criticalHabits,
        normalHabits,
        incubatorHabits,
        archivedHabits,
        addHabit,
        updateHabit,
        deleteHabit,
        loading,
        settings,
        setSettings,
        settingsLoading
    };
}
