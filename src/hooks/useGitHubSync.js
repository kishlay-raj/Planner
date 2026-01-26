import { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { Octokit } from '@octokit/rest';
import { format, parseISO, isValid } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

export function useGitHubSync(onSyncComplete) {
    const { currentUser } = useAuth();
    const [status, setStatus] = useState('idle'); // idle, fetching, formatting, pushing, pulling, parsing, restoring, success, error
    const [progress, setProgress] = useState('');
    const [error, setError] = useState(null);

    const syncToGitHub = async (token, owner, repo) => {
        if (!currentUser) {
            setError('User not authenticated');
            setStatus('error');
            return;
        }

        setStatus('fetching');
        setProgress('Fetching data from database...');
        setError(null);

        try {
            const uid = currentUser.uid;
            const octokit = new Octokit({ auth: token });

            // --- 1. Fetch All Data ---
            const tasksSnapshot = await getDocs(collection(db, 'users', uid, 'tasks_active'));
            const tasks = tasksSnapshot.docs.map(d => d.data());

            const notesSnapshot = await getDocs(collection(db, 'users', uid, 'planner_daily'));
            const dailyNotes = {};
            notesSnapshot.forEach(doc => dailyNotes[doc.id] = doc.data());

            const monthlySnapshot = await getDocs(collection(db, 'users', uid, 'planner_monthly'));
            const monthlyPlans = {};
            monthlySnapshot.forEach(doc => monthlyPlans[doc.id] = doc.data());

            const yearlySnapshot = await getDocs(collection(db, 'users', uid, 'planner_yearly'));
            const yearlyPlans = {};
            yearlySnapshot.forEach(doc => yearlyPlans[doc.id] = doc.data());

            const journalDoc = await getDoc(doc(db, 'users', uid, 'userData', 'dailyJournalData'));
            const journalData = journalDoc.exists() ? journalDoc.data() : {};

            const relapseDoc = await getDoc(doc(db, 'users', uid, 'userData', 'relapseJournalData'));
            const relapseData = relapseDoc.exists() ? relapseDoc.data() : {};


            // --- 2. Organize Data ---
            setStatus('formatting');
            setProgress('Organizing data...');
            const files = {};

            const getMonthFolderPath = (dateObj) => {
                const year = format(dateObj, 'yyyy');
                const monthName = format(dateObj, 'MM-MMMM');
                return `${year}/${monthName}`;
            };

            // Yearly
            Object.keys(yearlyPlans).forEach(year => {
                files[`${year}/${year}-Overview.md`] = formatYearlyPlan(year, yearlyPlans[year]);
            });

            // Monthly
            Object.keys(monthlyPlans).forEach(monthId => {
                const [y, m] = monthId.split('-');
                if (y && m) {
                    const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
                    if (isValid(dateObj)) {
                        const folder = getMonthFolderPath(dateObj);
                        files[`${folder}/${y}-${m.padStart(2, '0')}-Overview.md`] = formatMonthlyPlan(monthId, monthlyPlans[monthId]);
                    }
                }
            });

            // Daily
            const allDates = new Set([
                ...Object.keys(dailyNotes),
                ...Object.keys(journalData),
                ...tasks.filter(t => t.date).map(t => t.date),
                ...Object.keys(relapseData)
            ]);

            allDates.forEach(dateStr => {
                const dateObj = parseISO(dateStr);
                if (!isValid(dateObj)) return;

                const dayTasks = tasks.filter(t => t.date === dateStr);
                const dayNote = dailyNotes[dateStr];
                const dayJournal = journalData[dateStr];
                const dayRelapse = relapseData[dateStr];

                if (dayTasks.length > 0 || dayNote || dayJournal || dayRelapse) {
                    const folder = getMonthFolderPath(dateObj);
                    files[`${folder}/${dateStr}.md`] = formatDailyPage(dateStr, dayTasks, dayNote, dayJournal, dayRelapse);
                }
            });


            // --- 3. Push to GitHub ---
            setStatus('pushing');
            setProgress(`Connecting to ${owner}/${repo}...`);

            let branch = 'main';
            let latestCommitSha = null;
            let baseTreeSha = undefined; // undefined for root tree creation if empty
            let isInitialCommit = false;

            try {
                // Check if repo exists
                const { data: repoData } = await octokit.repos.get({ owner, repo });
                branch = repoData.default_branch || 'main'; // default to main if not set

            } catch (repoErr) {
                if (repoErr.status === 404) {
                    // Repo not found -> Create it
                    setStatus('creating_repo');
                    setProgress(`Repository not found. Creating '${repo}'...`);

                    try {
                        const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
                            name: repo,
                            private: true,
                            auto_init: true // Tries to create initial commit
                        });
                        branch = newRepo.default_branch || 'main';
                        setProgress(`Repository created. Pushing data...`);

                        // Small delay to ensure init propagates? usually fine.
                    } catch (createErr) {
                        throw new Error(`Could not create repository. Check token permissions (need 'repo' scope). Error: ${createErr.message}`);
                    }
                } else {
                    throw repoErr;
                }
            }

            // Get Reference (HEAD)
            // Even if we just created it with auto_init, we check ref.
            // If getRef fails with 409, it means the repo is truly empty (no commits).
            try {
                const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
                latestCommitSha = refData.object.sha;
                const { data: commitData } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
                baseTreeSha = commitData.tree.sha;
            } catch (refErr) {
                if (refErr.status === 409 || refErr.status === 404) {
                    // Repo is empty or branch doesn't exist yet. 
                    // For truly empty repos, we need to create an initial commit using Contents API
                    console.log('Repo is empty. Creating initial commit...');
                    isInitialCommit = true;

                    try {
                        // Create initial README to bootstrap the repository
                        await octokit.repos.createOrUpdateFileContents({
                            owner,
                            repo,
                            path: 'README.md',
                            message: 'Initialize repository for Flow Planner sync',
                            content: btoa('# Flow Planner Backup\n\nThis repository contains your Flow Planner data backup.'),
                            branch: branch
                        });

                        // Now fetch the ref that was just created
                        const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
                        latestCommitSha = refData.object.sha;
                        const { data: commitData } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
                        baseTreeSha = commitData.tree.sha;
                        isInitialCommit = false; // We now have a base to work from
                    } catch (initErr) {
                        console.error('Failed to initialize empty repo:', initErr);
                        throw new Error(`Cannot initialize empty repository: ${initErr.message}`);
                    }
                } else {
                    throw refErr;
                }
            }

            // Create blobs/tree
            const treeItems = [];
            for (const [path, content] of Object.entries(files)) {
                treeItems.push({ path, mode: '100644', type: 'blob', content });
            }

            // IMPORTANT: Re-fetch the latest commit right before creating tree
            // This ensures we always use the most recent commit as parent (fast-forward)
            if (!isInitialCommit) {
                try {
                    const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
                    latestCommitSha = refData.object.sha;
                    const { data: commitData } = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });
                    baseTreeSha = commitData.tree.sha;
                } catch (refetchErr) {
                    console.warn('Could not re-fetch latest commit, using cached version:', refetchErr);
                    // Continue with cached values
                }
            }

            // Create Tree
            // For empty repos, we must NOT include base_tree at all (not even undefined)
            // For existing repos, we include base_tree to preserve other files
            const treeParams = {
                owner,
                repo,
                tree: treeItems
            };

            if (baseTreeSha) {
                treeParams.base_tree = baseTreeSha;
            }

            const { data: newTree } = await octokit.git.createTree(treeParams);

            // Create Commit
            const { data: newCommit } = await octokit.git.createCommit({
                owner, repo, message: `Sync from Flow Planner: ${new Date().toLocaleString()}`,
                tree: newTree.sha,
                parents: latestCommitSha ? [latestCommitSha] : [],
            });

            // Update OR Create Ref
            if (isInitialCommit) {
                // If resolving "empty repo", we probably need to create the ref
                // But wait, does 'main' exist? If 409, it didn't exist in `getRef`.
                // So we create it.
                try {
                    await octokit.git.createRef({
                        owner,
                        repo,
                        ref: `refs/heads/${branch}`,
                        sha: newCommit.sha
                    });
                } catch (createRefErr) {
                    // If it existed but we missed it (race condition?), try update
                    await octokit.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: newCommit.sha });
                }
            } else {
                await octokit.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: newCommit.sha });
            }

            setStatus('success');
            setProgress('Synced successfully!');
            if (onSyncComplete) {
                onSyncComplete(new Date().toISOString());
            }

        } catch (e) {
            console.error(e);
            setError(e.message || 'Unknown error occurred');
            setStatus('error');
        }
    };

    const restoreFromGitHub = async (token, owner, repo) => {
        if (!currentUser) {
            setError('User not authenticated');
            setStatus('error');
            return;
        }

        setStatus('pulling');
        setProgress('Fetching files from GitHub...');
        setError(null);

        try {
            const uid = currentUser.uid;
            const octokit = new Octokit({ auth: token });
            const { data: repoData } = await octokit.repos.get({ owner, repo });
            const branch = repoData.default_branch;

            // Get the full tree recursively
            const { data: treeData } = await octokit.git.getTree({
                owner,
                repo,
                tree_sha: branch,
                recursive: '1'
            });

            // Filter for markdown files
            const mdFiles = treeData.tree.filter(item => item.path.endsWith('.md') && item.type === 'blob');

            setStatus('restoring');
            setProgress(`Restoring ${mdFiles.length} files...`);

            const batchLimit = 500; // Firestore batch limit
            let batch = writeBatch(db);
            let opCount = 0;

            // Prepare memory structures for merged docs
            const dailyJournalUpdates = {}; // date -> object
            const relapseJournalUpdates = {}; // date -> object

            // Helper to commit batch if full
            const checkBatch = async () => {
                opCount++;
                if (opCount >= batchLimit) {
                    await batch.commit();
                    batch = writeBatch(db);
                    opCount = 0;
                }
            };

            for (const file of mdFiles) {
                // Fetch content
                const { data: blobData } = await octokit.git.getBlob({
                    owner,
                    repo,
                    file_sha: file.sha
                });
                // Content is base64 encoded
                const content = atob(blobData.content);
                const pathParts = file.path.split('/');
                const filename = pathParts[pathParts.length - 1];

                if (filename.endsWith('Overview.md')) {
                    if (filename.match(/^\d{4}-Overview\.md$/)) {
                        // Yearly
                        const year = filename.split('-')[0];
                        const parsed = parseYearlyPlan(content);
                        batch.set(doc(db, 'users', uid, 'planner_yearly', year), parsed, { merge: true });
                        await checkBatch();
                    } else if (filename.match(/^\d{4}-\d{2}-Overview\.md$/)) {
                        // Monthly
                        const monthId = filename.substring(0, 7); // YYYY-MM
                        const parsed = parseMonthlyPlan(content);
                        batch.set(doc(db, 'users', uid, 'planner_monthly', monthId), parsed, { merge: true });
                        await checkBatch();
                    }
                } else if (filename.match(/^\d{4}-\d{2}-\d{2}\.md$/)) {
                    // Daily
                    const dateStr = filename.replace('.md', '');
                    const { tasks, note, journal, relapse } = parseDailyPage(content);

                    // 1. Tasks
                    for (const t of tasks) {
                        const taskId = t.id || Date.now().toString() + Math.random().toString(36).substr(2, 5);
                        // Make sure to add date
                        batch.set(doc(db, 'users', uid, 'tasks_active', taskId), { ...t, date: dateStr, createdAt: new Date().toISOString() }, { merge: true });
                        await checkBatch();
                    }

                    // 2. Note
                    if (note) {
                        batch.set(doc(db, 'users', uid, 'planner_daily', dateStr), { content: note }, { merge: true });
                        await checkBatch();
                    }

                    // 3. Journal (Collect to merge later)
                    if (journal) {
                        dailyJournalUpdates[dateStr] = journal;
                    }

                    // 4. Relapse (Collect to merge later)
                    if (relapse) {
                        relapseJournalUpdates[dateStr] = relapse;
                    }
                }
            }

            // Commit final items in loop
            if (opCount > 0) {
                await batch.commit();
                batch = writeBatch(db);
                opCount = 0;
            }

            // Update monolithic docs (DailyJournal and RelapseJournal)
            if (Object.keys(dailyJournalUpdates).length > 0) {
                batch.set(doc(db, 'users', uid, 'userData', 'dailyJournalData'), dailyJournalUpdates, { merge: true });
                opCount++;
            }
            if (Object.keys(relapseJournalUpdates).length > 0) {
                batch.set(doc(db, 'users', uid, 'userData', 'relapseJournalData'), relapseJournalUpdates, { merge: true });
                opCount++;
            }

            if (opCount > 0) {
                await batch.commit();
            }


            setStatus('success');
            setProgress('Restore completed!');

        } catch (e) {
            console.error(e);
            setError(e.message || 'Restore failed');
            setStatus('error');
        }
    };

    return { syncToGitHub, restoreFromGitHub, status, progress, error };
}

// --- Formatters ---

function formatYearlyPlan(year, data) {
    if (!data) return '';
    return `# ${year} Year Plan\n\n` +
        `## Theme/Focus\n${data.yearFocus || '(No focus set)'}\n\n` +
        `## Vision\n${data.vision || ''}\n\n` +
        `## Goals\n${(data.goals || []).map(g => `- [${g.completed ? 'x' : ' '}] ${g.text}`).join('\n')}\n`;
}

function formatMonthlyPlan(monthId, data) {
    if (!data) return '';
    const { monthlyFocus, rules, journal, habits, notes } = data;

    let md = `# Plan for ${monthId}\n\n`;
    if (monthlyFocus) md += `## 🎯 Monthly Focus\n${monthlyFocus}\n\n`;
    if (rules) md += `## 📜 Rules\n${rules}\n\n`;

    if (journal) {
        md += `## 🧠 Reflection\n`;
        Object.entries(journal).forEach(([k, v]) => {
            if (v) md += `**${k}**: ${v}\n\n`;
        });
    }

    if (habits && habits.length > 0) {
        md += `## 🔄 Habits\n`;
        habits.forEach(h => {
            const daysCount = Object.values(h.days || {}).filter(Boolean).length;
            md += `- ${h.name}: ${daysCount} days\n`;
        });
        md += '\n';
    }

    if (notes) md += `## 📝 Notes\n${notes}\n`;

    return md;
}

function formatDailyPage(dateStr, tasks, dayNote, dayJournal, dayRelapse) {
    let md = `# ${dateStr}\n\n`;

    // 1. Daily Journal
    if (dayJournal) {
        md += `## 📔 Daily Journal\n`;
        if (dayJournal.responses) {
            Object.values(dayJournal.responses).forEach(r => {
                if (r) md += `> ${r}\n\n`;
            });
        }
        if (dayJournal.notes) {
            md += `### Brain Dump\n${dayJournal.notes}\n\n`;
        }
    }

    // 2. Tasks
    if (tasks && tasks.length > 0) {
        md += `## ✅ Tasks\n`;
        const priorities = { P1: [], P2: [], P3: [], P4: [] };
        tasks.forEach(t => {
            const p = t.priority || 'P4';
            if (priorities[p]) priorities[p].push(t);
        });

        Object.keys(priorities).forEach(p => {
            if (priorities[p].length > 0) {
                md += `### ${p}\n`;
                priorities[p].forEach(t => {
                    md += `- [${t.completed ? 'x' : ' '}] ${t.name} ${t.tag ? `(#${t.tag})` : ''}\n`;
                });
                md += '\n';
            }
        });
    }

    // 3. Notes Panel
    if (dayNote && dayNote.content) {
        md += `## 🗒️ Notes Panel\n${dayNote.content}\n\n`;
    }

    // 4. Relapse/Fortification
    if (dayRelapse) {
        md += `## 🛡️ Fortification Log\n${JSON.stringify(dayRelapse, null, 2)}\n`;
    }

    return md;
}

// --- Parsers ---

function parseYearlyPlan(content) {
    const data = { yearFocus: '', vision: '', goals: [] };
    const focusMatch = content.match(/## Theme\/Focus\n([\s\S]*?)\n\n##/);
    if (focusMatch) data.yearFocus = focusMatch[1].trim();

    const visionMatch = content.match(/## Vision\n([\s\S]*?)\n\n##/);
    if (visionMatch) data.vision = visionMatch[1].trim();

    const goalsMatch = content.match(/## Goals\n([\s\S]*?)$/);
    if (goalsMatch) {
        const lines = goalsMatch[1].split('\n');
        data.goals = lines.map(line => {
            const match = line.match(/- \[(.| )\] (.*)/);
            if (match) return { completed: match[1] === 'x', text: match[2].trim() };
            return null;
        }).filter(Boolean);
    }
    return data;
}

function parseMonthlyPlan(content) {
    const data = { monthlyFocus: '', rules: '', notes: '' };

    const focusMatch = content.match(/## 🎯 Monthly Focus\n([\s\S]*?)(\n\n##|$)/);
    if (focusMatch) data.monthlyFocus = focusMatch[1].trim();

    const rulesMatch = content.match(/## 📜 Rules\n([\s\S]*?)(\n\n##|$)/);
    if (rulesMatch) data.rules = rulesMatch[1].trim();

    const notesMatch = content.match(/## 📝 Notes\n([\s\S]*?)(\n\n##|$)/);
    if (notesMatch) data.notes = notesMatch[1].trim();

    return data;
}


function parseDailyPage(content) {
    const result = { tasks: [], note: null, journal: null, relapse: null };

    const relapseMatch = content.match(/## 🛡️ Fortification Log\n([\s\S]*?)(\n\n##|$)/);
    if (relapseMatch) {
        try {
            result.relapse = JSON.parse(relapseMatch[1].trim());
        } catch (e) {
            console.warn('Failed to parse relapse log', e);
        }
    }

    const notesMatch = content.match(/## 🗒️ Notes Panel\n([\s\S]*?)(\n\n##|$)/);
    if (notesMatch) {
        result.note = notesMatch[1].trim();
    }

    const tasksSection = content.match(/## ✅ Tasks\n([\s\S]*?)(\n\n##|$)/);
    if (tasksSection) {
        const lines = tasksSection[1].split('\n');
        let currentPriority = 'P4';
        lines.forEach(line => {
            if (line.match(/^### P\d/)) {
                currentPriority = line.replace('###', '').trim();
            } else {
                const taskMatch = line.match(/- \[(.| )\] (.*?)( \(#(.*?)\))?$/);
                if (taskMatch) {
                    result.tasks.push({
                        name: taskMatch[2].trim(),
                        completed: taskMatch[1] === 'x',
                        tag: taskMatch[4] || null,
                        priority: currentPriority
                    });
                }
            }
        });
    }

    const journalSection = content.match(/## 📔 Daily Journal\n([\s\S]*?)(\n\n##|$)/);
    if (journalSection) {
        result.journal = { responses: {}, notes: '' };
        const jContent = journalSection[1];

        const brainDumpMatch = jContent.match(/### Brain Dump\n([\s\S]*?)$/);
        if (brainDumpMatch) {
            result.journal.notes = brainDumpMatch[1].trim();
        }
    }

    return result;
}
