import React from 'react';
import { Keyboard } from 'lucide-react';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import '../../styles/main.css';

const ShortcutsSettings = () => {
  const { shortcuts, formatShortcut } = useKeyboardShortcuts();

  // Convert shortcuts object to an array to map over it
  const allShortcuts = Object.entries(shortcuts).map(([key, value]) => ({
    id: key,
    ...value
  }));

  return (
    <div className="settings-section card">
      <div className="section-header">
        <h2>
          <Keyboard size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Klavye Kısayolları
        </h2>
        <p>Uygulamada verimliliğinizi artırmak için kullanabileceğiniz klavye kısayolları.</p>
      </div>
      
      <div className="shortcuts-container single-list">
        <table className="shortcuts-table">
          <thead>
            <tr>
              <th>Açıklama</th>
              <th style={{ textAlign: 'right' }}>Kısayol</th>
            </tr>
          </thead>
          <tbody>
            {allShortcuts.map(shortcut => (
              <tr key={shortcut.id}>
                <td className="shortcut-description">{shortcut.description}</td>
                <td className="shortcut-keys">
                  <code>{formatShortcut(shortcut)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShortcutsSettings; 