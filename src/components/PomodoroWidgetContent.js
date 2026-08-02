import React, { useState, useEffect } from 'react';

/**
 * Presentational component rendered inside the PiP (Picture-in-Picture) window.
 * Uses inline styles because the PiP window is a separate document context.
 */
export default function PomodoroWidgetContent({
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

  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      background: config.bg, color: 'white',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 12px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      gap: '6px', userSelect: 'none',
      boxSizing: 'border-box',
    }}>
      {/* Mode label */}
      <div style={{
        fontSize: '10px', fontWeight: 700,
        letterSpacing: '2px', opacity: 0.85,
        WebkitAppRegion: 'drag', cursor: 'move', width: '100%', textAlign: 'center'
      }}>
        {config.label}
        {mode === 'pomodoro' && (workType === 'deep' ? ' · 🧠 Deep' : ' · 📋 Shallow')}
      </div>

      {/* Timer Display & Main Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          fontSize: '42px', fontWeight: 900,
          fontFamily: "'Courier New', monospace",
          letterSpacing: '2px', lineHeight: 1,
        }}>
          {mins}:{secs}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={onToggle}
            title={isActive ? "Pause" : "Start"}
            style={{
              background: 'rgba(255,255,255,0.25)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '50%',
              width: '36px', height: '36px',
              color: 'white', fontSize: '15px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              WebkitAppRegion: 'no-drag',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {isActive ? '⏸' : '▶'}
          </button>

          {(mode === 'shortBreak' || mode === 'longBreak') && (
            <button
              onClick={onSkip}
              title="Skip Break"
              style={{
                background: 'rgba(255,255,255,0.25)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '50%',
                width: '36px', height: '36px',
                color: 'white', fontSize: '15px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                WebkitAppRegion: 'no-drag',
              }}
            >
              ⏭
            </button>
          )}
        </div>
      </div>

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
      {pomodoroSubtasks.length > 0 && (
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
      {pomodoroNotes && (
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
    </div>
  );
}
