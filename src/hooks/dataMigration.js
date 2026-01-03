import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Migrates user data from old flat structure to new hierarchical structure
 * Call this once when user logs in if migration hasn't been done
 */
export async function migrateUserData(userId) {
    console.log('🔄 Starting data migration for user:', userId);

    const migrationFlagRef = doc(db, 'users', userId, 'profile', 'migration');
    const migrationSnap = await getDoc(migrationFlagRef);

    if (migrationSnap.exists() && migrationSnap.data().v2Complete) {
        console.log('✅ Migration already complete');
        return { success: true, alreadyMigrated: true };
    }

    try {
        const batch = writeBatch(db);
        const oldDataPath = collection(db, 'users', userId, 'userData');
        const oldDocs = await getDocs(oldDataPath);

        for (const docSnap of oldDocs.docs) {
            const docId = docSnap.id;
            const data = docSnap.data();

            switch (docId) {
                case 'allTasks':
                case 'scheduledTasks':
                    // Migrate tasks to tasks/active collection
                    if (data._isArray && Array.isArray(data.items)) {
                        for (const task of data.items) {
                            const taskId = task.id?.toString() || Date.now().toString();
                            const taskRef = doc(db, 'users', userId, 'tasks', 'active', taskId);
                            batch.set(taskRef, {
                                ...task,
                                migratedFrom: docId,
                                migratedAt: Date.now()
                            }, { merge: true });
                        }
                    }
                    break;

                case 'taskDumpData':
                    // Migrate to tasks/dump collection
                    if (data._isArray && Array.isArray(data.items)) {
                        for (const task of data.items) {
                            const taskId = task.id?.toString() || Date.now().toString();
                            const taskRef = doc(db, 'users', userId, 'tasks', 'dump', taskId);
                            batch.set(taskRef, task);
                        }
                    }
                    break;

                case 'dailyNotes':
                    // Migrate each date to planner/daily/{date}
                    for (const [dateKey, content] of Object.entries(data)) {
                        if (dateKey.startsWith('_')) continue;
                        const noteRef = doc(db, 'users', userId, 'planner', 'daily', dateKey);
                        batch.set(noteRef, { content, migratedAt: Date.now() });
                    }
                    break;

                case 'dailyJournalData':
                    // Migrate each date to journal/entries/{date}
                    for (const [dateKey, entry] of Object.entries(data)) {
                        if (dateKey.startsWith('_')) continue;
                        const journalRef = doc(db, 'users', userId, 'journal', 'entries', dateKey);
                        batch.set(journalRef, { ...entry, migratedAt: Date.now() });
                    }
                    break;

                case 'journalPrompts':
                    // Migrate to journal/config/prompts
                    const promptsRef = doc(db, 'users', userId, 'journal', 'config', 'prompts');
                    batch.set(promptsRef, data);
                    break;

                case 'weeklyPlannerData':
                    // Migrate each week to planner/weekly/{weekId}
                    for (const [weekId, weekData] of Object.entries(data)) {
                        if (weekId.startsWith('_')) continue;
                        const weekRef = doc(db, 'users', userId, 'planner', 'weekly', weekId);
                        batch.set(weekRef, weekData);
                    }
                    break;

                case 'monthlyPlannerData':
                    // Migrate each month to planner/monthly/{monthId}
                    for (const [monthId, monthData] of Object.entries(data)) {
                        if (monthId.startsWith('_')) continue;
                        const monthRef = doc(db, 'users', userId, 'planner', 'monthly', monthId);
                        batch.set(monthRef, monthData);
                    }
                    break;

                case 'yearlyPlannerData':
                    // Migrate each year to planner/yearly/{year}
                    for (const [year, yearData] of Object.entries(data)) {
                        if (year.startsWith('_')) continue;
                        const yearRef = doc(db, 'users', userId, 'planner', 'yearly', year);
                        batch.set(yearRef, yearData);
                    }
                    break;

                case 'routineData':
                    // Migrate routines to routines/list
                    if (data._isArray && Array.isArray(data.items)) {
                        for (const routine of data.items) {
                            const routineId = routine.id?.toString() || Date.now().toString();
                            const routineRef = doc(db, 'users', userId, 'routines', 'list', routineId);
                            batch.set(routineRef, routine);
                        }
                    } else if (Array.isArray(data)) {
                        for (const routine of data) {
                            const routineId = routine.id?.toString() || Date.now().toString();
                            const routineRef = doc(db, 'users', userId, 'routines', 'list', routineId);
                            batch.set(routineRef, routine);
                        }
                    }
                    break;

                case 'pomodoroSettings':
                    const settingsRef = doc(db, 'users', userId, 'profile', 'pomodoroSettings');
                    batch.set(settingsRef, data);
                    break;

                case 'pomodoroStats':
                    const statsRef = doc(db, 'users', userId, 'pomodoro', 'stats', 'overall');
                    batch.set(statsRef, data);
                    break;

                case 'navConfig':
                    const navRef = doc(db, 'users', userId, 'profile', 'settings');
                    batch.set(navRef, { navConfig: data._isArray ? data.items : data }, { merge: true });
                    break;
            }
        }

        // Mark migration as complete
        batch.set(migrationFlagRef, { v2Complete: true, migratedAt: Date.now() });

        await batch.commit();
        console.log('✅ Migration complete!');
        return { success: true, alreadyMigrated: false };

    } catch (error) {
        console.error('❌ Migration failed:', error);
        return { success: false, error };
    }
}

/**
 * Check if user needs migration
 */
export async function needsMigration(userId) {
    const migrationFlagRef = doc(db, 'users', userId, 'profile', 'migration');
    const snap = await getDoc(migrationFlagRef);
    return !snap.exists() || !snap.data()?.v2Complete;
}
