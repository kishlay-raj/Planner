import React, { useState, useEffect } from 'react';

/**
 * Presentational component rendered inside the PiP (Picture-in-Picture) window.
 * Uses inline styles because the PiP window is a separate document context.
 */
export default function PomodoroWidgetContent({
  pipWindow,
  timeLeft,
  isActive,
  mode,
  workType,
  primaryTask,
  secondaryTask,
  allowedWebsites = '',
  pomodoroNotes = '',
  pomodoroSubtasks = [],
  onToggle,
  onSkip,
  onStartNewPomodoro,
  onWorkTypeToggle,
  pomodoroDuration = 30,
  tasks = [],
  onUpdatePrimaryTask,
  onUpdateSecondaryTask,
  onUpdateNotes,
  onUpdateSubtasks
}) {
  const [editingPrimary, setEditingPrimary] = useState(false);
  const [localPrimary, setLocalPrimary] = useState(primaryTask);
  const [editingSecondary, setEditingSecondary] = useState(false);
  const [localSecondary, setLocalSecondary] = useState(secondaryTask);
  const [quickInput, setQuickInput] = useState('');
  const [isDetailed, setIsDetailed] = useState(true);

  // New Pomodoro Creation State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState(primaryTask || '');
  const [newSecondaryTaskName, setNewSecondaryTaskName] = useState(secondaryTask || '');
  const [newDuration, setNewDuration] = useState(pomodoroDuration || 30);
  const [newWorkType, setNewWorkType] = useState(workType || 'deep');

  useEffect(() => { setLocalPrimary(primaryTask); }, [primaryTask]);
  useEffect(() => { setLocalSecondary(secondaryTask); }, [secondaryTask]);

  const handlePrimarySave = () => {
    setEditingPrimary(false);
    if (onUpdatePrimaryTask) onUpdatePrimaryTask(localPrimary);
  };

  const handleSecondarySave = () => {
    setEditingSecondary(false);
    if (onUpdateSecondaryTask) onUpdateSecondaryTask(localSecondary);
  };

  const handleQuickInputSubmit = (e) => {
    if (e.key === 'Enter' && quickInput.trim()) {
      e.preventDefault();
      const val = quickInput.trim();
      if (val.startsWith('-')) {
        const text = val.substring(1).trim();
        if (text && onUpdateSubtasks) {
          onUpdateSubtasks([...pomodoroSubtasks, { id: Date.now().toString(), text, completed: false }]);
        }
      } else {
        if (onUpdateNotes) {
          onUpdateNotes(pomodoroNotes ? `${pomodoroNotes}\n${val}` : val);
        }
      }
      setQuickInput('');
    }
  };

  const toggleSubtask = (id) => {
    if (onUpdateSubtasks) {
      onUpdateSubtasks(pomodoroSubtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
    }
  };

  const deleteSubtask = (id) => {
    if (onUpdateSubtasks) {
      onUpdateSubtasks(pomodoroSubtasks.filter(s => s.id !== id));
    }
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  const modeConfig = {
    pomodoro:   { bg: 'linear-gradient(135deg, #b74b4b 0%, #a03e3e 100%)', label: '🍅 FOCUS' },
    shortBreak: { bg: 'linear-gradient(135deg, #4c9195 0%, #3d7e82 100%)', label: '☕ SHORT BREAK' },
    longBreak:  { bg: 'linear-gradient(135deg, #457ca3 0%, #386a8e 100%)', label: '🛌 LONG BREAK' },
  };
  const config = modeConfig[mode] || modeConfig.pomodoro;

  const handleToggleDetailed = () => {
    const nextState = !isDetailed;
    setIsDetailed(nextState);
    if (pipWindow && pipWindow.resizeTo) {
      if (nextState) {
        pipWindow.resizeTo(330, 270);
      } else {
        pipWindow.resizeTo(280, 150);
      }
    }
  };

  const handleOpenNewModal = () => {
    setNewTaskName(primaryTask || '');
    setNewSecondaryTaskName(secondaryTask || '');
    setNewDuration(pomodoroDuration || 30);
    setNewWorkType(workType || 'deep');
    setShowNewModal(true);
    if (pipWindow && pipWindow.resizeTo) {
      pipWindow.resizeTo(330, 280);
    }
  };

  const handleCloseNewModal = () => {
    setShowNewModal(false);
    if (pipWindow && pipWindow.resizeTo && !isDetailed) {
      pipWindow.resizeTo(280, 150);
    }
  };

  const handleStartNew = (customMins) => {
    const duration = Number(customMins || newDuration) || pomodoroDuration || 30;
    if (onStartNewPomodoro) {
      onStartNewPomodoro({
        durationMinutes: duration,
        taskName: newTaskName.trim(),
        secondaryTaskName: newWorkType === 'deep' ? '' : newSecondaryTaskName.trim(),
        newWorkType: newWorkType,
        startImmediately: true
      });
    }
    setShowNewModal(false);
  };

  const pendingTasks = Array.isArray(tasks)
    ? tasks.filter(t => !t.completed && t.name && t.name.trim()).slice(0, 4)
    : [];

  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      background: showNewModal ? 'linear-gradient(135deg, #a03e3e 0%, #832828 100%)' : config.bg,
      color: 'white',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 12px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      gap: '6px', userSelect: 'none',
      boxSizing: 'border-box',
    }}>
      {/* ── NEW POMODORO CREATION VIEW ── */}
      {showNewModal ? (
        <div 
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCloseNewModal();
          }}
          style={{
            width: '100%', display: 'flex', flexDirection: 'column', gap: '8px',
            WebkitAppRegion: 'no-drag'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.25)', paddingBottom: '4px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>🍅</span>
              <span>START NEW POMODORO</span>
            </div>
            <button
              onClick={handleCloseNewModal}
              title="Cancel"
              style={{
                background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)',
                fontSize: '15px', cursor: 'pointer', padding: '0 4px', lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>

          {/* Primary Task Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <input
              autoFocus
              type="text"
              placeholder="What are you focusing on?"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleStartNew();
              }}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '11.5px',
                fontWeight: 600,
                padding: '5px 8px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            {/* Quick Task Suggestions from pending list */}
            {pendingTasks.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', padding: '2px 0' }}>
                {pendingTasks.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setNewTaskName(t.name)}
                    title={`Use task: ${t.name}`}
                    style={{
                      background: newTaskName === t.name ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '9.5px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Work Type Toggle */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setNewWorkType('deep')}
              style={{
                flex: 1,
                padding: '4px 6px',
                borderRadius: '6px',
                border: newWorkType === 'deep' ? '1.5px solid white' : '1px solid rgba(255,255,255,0.2)',
                background: newWorkType === 'deep' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)',
                color: 'white',
                fontSize: '10px',
                fontWeight: newWorkType === 'deep' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
              }}
            >
              <span>🧠</span> Deep Work
            </button>
            <button
              onClick={() => setNewWorkType('shallow')}
              style={{
                flex: 1,
                padding: '4px 6px',
                borderRadius: '6px',
                border: newWorkType === 'shallow' ? '1.5px solid white' : '1px solid rgba(255,255,255,0.2)',
                background: newWorkType === 'shallow' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)',
                color: 'white',
                fontSize: '10px',
                fontWeight: newWorkType === 'shallow' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
              }}
            >
              <span>📋</span> Shallow Work
            </button>
          </div>

          {/* Secondary Task Input if Shallow */}
          {newWorkType === 'shallow' && (
            <input
              type="text"
              placeholder="Secondary task (optional)..."
              value={newSecondaryTaskName}
              onChange={(e) => setNewSecondaryTaskName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleStartNew();
              }}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '10.5px',
                padding: '4px 8px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          )}

          {/* Duration Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 600 }}>Duration:</span>
            {[15, 25, 30, 45, 60].map(minsOption => (
              <button
                key={minsOption}
                onClick={() => setNewDuration(minsOption)}
                style={{
                  flex: 1,
                  padding: '3px 0',
                  borderRadius: '4px',
                  border: newDuration === minsOption ? '1.5px solid white' : '1px solid rgba(255,255,255,0.2)',
                  background: newDuration === minsOption ? 'white' : 'rgba(0,0,0,0.2)',
                  color: newDuration === minsOption ? '#832828' : 'white',
                  fontSize: '10px',
                  fontWeight: newDuration === minsOption ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {minsOption}m
              </button>
            ))}
          </div>

          {/* Actions: Start Focus and Cancel */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
            <button
              onClick={() => handleStartNew()}
              style={{
                flex: 1,
                background: '#ffffff',
                color: '#832828',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
              }}
            >
              <span>▶</span> START FOCUS ({newDuration}m)
            </button>
            <button
              onClick={handleCloseNewModal}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* ── ACTIVE TIMER VIEW ── */
        <>
          {/* Mode label */}
          <div style={{
            fontSize: '10px', fontWeight: 700,
            letterSpacing: '2px', opacity: 0.85,
            WebkitAppRegion: 'drag', cursor: 'move', width: '100%', textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
          }}>
            <span>{config.label}</span>
            {mode === 'pomodoro' && (
              <span
                onClick={onWorkTypeToggle}
                style={{
                  cursor: onWorkTypeToggle ? 'pointer' : 'default',
                  opacity: 0.9,
                  WebkitAppRegion: 'no-drag'
                }}
                title={onWorkTypeToggle ? "Click to toggle Deep/Shallow" : undefined}
              >
                {workType === 'deep' ? ' · 🧠 Deep' : ' · 📋 Shallow'}
              </span>
            )}
          </div>

          {/* Timer Display & Main Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              fontSize: '40px', fontWeight: 900,
              fontFamily: "'Courier New', monospace",
              letterSpacing: '2px', lineHeight: 1,
            }}>
              {mins}:{secs}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <button
                onClick={onToggle}
                title={isActive ? "Pause" : "Start"}
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '50%',
                  width: '34px', height: '34px',
                  color: 'white', fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  WebkitAppRegion: 'no-drag',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                {isActive ? '⏸' : '▶'}
              </button>

              {/* Dedicated New Pomodoro Trigger Button */}
              <button
                onClick={handleOpenNewModal}
                title="Start a new Pomodoro"
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '50%',
                  width: '34px', height: '34px',
                  color: 'white', fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  WebkitAppRegion: 'no-drag',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                🍅+
              </button>

              {(mode === 'shortBreak' || mode === 'longBreak') && (
                <button
                  onClick={onSkip}
                  title="Skip Break"
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderRadius: '50%',
                    width: '34px', height: '34px',
                    color: 'white', fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    WebkitAppRegion: 'no-drag',
                  }}
                >
                  ⏭
                </button>
              )}

              <button
                onClick={handleToggleDetailed}
                title={isDetailed ? "Simple View" : "Detailed View"}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  WebkitAppRegion: 'no-drag',
                  marginLeft: '2px',
                }}
              >
                {isDetailed ? '▲' : '▼'}
              </button>
            </div>
          </div>

          {/* Quick Start Pomodoro Banner when in Break mode */}
          {(mode === 'shortBreak' || mode === 'longBreak') && (
            <div style={{
              display: 'flex', gap: '6px', width: '100%', justifyContent: 'center',
              margin: '2px 0'
            }}>
              <button
                onClick={() => handleStartNew(pomodoroDuration)}
                title="Start Pomodoro focus immediately"
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.25)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  color: 'white',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  WebkitAppRegion: 'no-drag',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                <span>🍅</span>
                <span>Start Focus ({pomodoroDuration}m)</span>
              </button>
              <button
                onClick={handleOpenNewModal}
                title="Configure and start new Pomodoro"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: 'white',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  WebkitAppRegion: 'no-drag'
                }}
              >
                ⚙️
              </button>
            </div>
          )}

          {/* Tasks & Allowed Websites section */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '4px',
            width: '100%',
          }}>
            {primaryTask && (
              editingPrimary ? (
                <input
                  autoFocus
                  value={localPrimary}
                  onChange={(e) => setLocalPrimary(e.target.value)}
                  onBlur={handlePrimarySave}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePrimarySave(); }}
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    width: '100%',
                    outline: 'none',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    WebkitAppRegion: 'no-drag',
                  }}
                />
              ) : (
                <div 
                  onClick={() => setEditingPrimary(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(255,255,255,0.18)',
                    borderRadius: '6px', padding: '3px 10px',
                    overflow: 'hidden', cursor: 'pointer',
                    WebkitAppRegion: 'no-drag',
                  }}
                >
                  <div style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: '#4ade80', flexShrink: 0,
                  }} />
                  <div style={{
                    fontSize: '11px', fontWeight: 700, opacity: 0.95,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {primaryTask}
                  </div>
                </div>
              )
            )}

            {secondaryTask && workType !== 'deep' && (
              editingSecondary ? (
                <input
                  autoFocus
                  value={localSecondary}
                  onChange={(e) => setLocalSecondary(e.target.value)}
                  onBlur={handleSecondarySave}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSecondarySave(); }}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 500,
                    padding: '3px 8px',
                    width: '100%',
                    outline: 'none',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    WebkitAppRegion: 'no-drag',
                  }}
                />
              ) : (
                <div 
                  onClick={() => setEditingSecondary(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '6px', padding: '3px 10px',
                    overflow: 'hidden', cursor: 'pointer',
                    WebkitAppRegion: 'no-drag',
                  }}
                >
                  <div style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    border: '1.5px solid #60a5fa',
                    flexShrink: 0,
                  }} />
                  <div style={{
                    fontSize: '10px', fontWeight: 500, opacity: 0.8,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {secondaryTask}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Subtasks List */}
          {isDetailed && pomodoroSubtasks.length > 0 && (
            <div style={{
              width: '100%', display: 'flex', flexDirection: 'column', gap: '3px',
              maxHeight: '70px', overflowY: 'auto', paddingRight: '2px'
            }}>
              {pomodoroSubtasks.map(st => (
                <div
                  key={st.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(0,0,0,0.15)', padding: '2px 8px', borderRadius: '4px',
                    fontSize: '10.5px', color: 'white'
                  }}
                >
                  <div
                    onClick={() => toggleSubtask(st.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}
                  >
                    <span style={{ fontSize: '11px', opacity: 0.9 }}>{st.completed ? '☑' : '☐'}</span>
                    <span style={{ textDecoration: st.completed ? 'line-through' : 'none', opacity: st.completed ? 0.6 : 0.95 }}>
                      {st.text}
                    </span>
                  </div>
                  <span
                    onClick={() => deleteSubtask(st.id)}
                    style={{ cursor: 'pointer', opacity: 0.5, fontSize: '12px', paddingLeft: '6px' }}
                    title="Delete subtask"
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Notes Display */}
          {isDetailed && pomodoroNotes && (
            <div style={{
              width: '100%', background: 'rgba(0,0,0,0.15)', borderRadius: '4px',
              padding: '4px 8px', fontSize: '10px', fontStyle: 'italic',
              opacity: 0.9, maxHeight: '50px', overflowY: 'auto', whiteSpace: 'pre-wrap',
              borderLeft: '2px solid rgba(255,255,255,0.4)',
              boxSizing: 'border-box'
            }}>
              {pomodoroNotes}
            </div>
          )}

          {/* Quick Input Field */}
          {isDetailed && (
            <input
              type="text"
              placeholder="Add note or start with '-' for subtask..."
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={handleQuickInputSubmit}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '10.5px',
                padding: '4px 8px',
                outline: 'none',
                marginTop: 'auto',
                boxSizing: 'border-box',
                WebkitAppRegion: 'no-drag'
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

