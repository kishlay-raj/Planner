import React from 'react';

/**
 * Presentational component rendered inside the PiP (Picture-in-Picture) window.
 * Uses only inline styles because the PiP window is a separate document
 * without access to MUI's theme/styled-components.
 */
export default function PomodoroWidgetContent({
  timeLeft, isActive, mode, workType, primaryTask, secondaryTask, onToggle, onSkip
}) {
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  const modeConfig = {
    pomodoro:   { bg: 'linear-gradient(135deg, #b74b4b 0%, #a03e3e 100%)', label: '🍅 FOCUS' },
    shortBreak: { bg: 'linear-gradient(135deg, #4c9195 0%, #3d7e82 100%)', label: '☕ SHORT BREAK' },
    longBreak:  { bg: 'linear-gradient(135deg, #457ca3 0%, #386a8e 100%)', label: '🛌 LONG BREAK' },
  };
  const config = modeConfig[mode] || modeConfig.pomodoro;

  const hasTasks = primaryTask || secondaryTask;

  return (
    <div style={{
      width: '100%', height: '100vh',
      background: config.bg, color: 'white',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '10px 16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      gap: '5px', cursor: 'default', userSelect: 'none',
    }}>
      {/* Mode label */}
      <div style={{
        fontSize: '10px', fontWeight: 700,
        letterSpacing: '2px', opacity: 0.8,
      }}>
        {config.label}
        {mode === 'pomodoro' && (workType === 'deep' ? ' · 🧠 Deep' : ' · 📋 Shallow')}
      </div>

      {/* Timer */}
      <div style={{
        fontSize: '54px', fontWeight: 900,
        fontFamily: "'Courier New', monospace",
        letterSpacing: '3px', lineHeight: 1,
      }}>
        {mins}:{secs}
      </div>

      {/* Tasks section */}
      {hasTasks && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '3px',
          width: '100%', maxWidth: '280px', marginTop: '2px',
        }}>
          {/* Primary task */}
          {primaryTask && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '6px', padding: '3px 10px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)', flexShrink: 0,
              }} />
              <div style={{
                fontSize: '11px', fontWeight: 700, opacity: 0.95,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {primaryTask}
              </div>
            </div>
          )}
          {/* Secondary task */}
          {secondaryTask && workType !== 'deep' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '6px', padding: '3px 10px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.7)',
                flexShrink: 0,
              }} />
              <div style={{
                fontSize: '10px', fontWeight: 500, opacity: 0.7,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {secondaryTask}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '3px' }}>
        {/* Play / Pause button */}
        <button
          onClick={onToggle}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '50%',
            width: '34px', height: '34px',
            color: 'white', fontSize: '14px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isActive ? '⏸' : '▶'}
        </button>

        {/* Skip Break button */}
        {(mode === 'shortBreak' || mode === 'longBreak') && (
          <button
            onClick={onSkip}
            title="Skip Break"
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              width: '34px', height: '34px',
              color: 'white', fontSize: '14px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ⏭
          </button>
        )}
      </div>
    </div>
  );
}
