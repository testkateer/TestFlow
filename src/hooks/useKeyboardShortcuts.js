import { useEffect, useCallback } from 'react';

/**
 * Custom hook for managing keyboard shortcuts in TestEditor
 * @param {Object} handlers - Object containing handler functions for different shortcuts
 * @returns {Object} - Object containing shortcut information and helper functions
 */
const useKeyboardShortcuts = (handlers = {}) => {
  const {
    onUndo,
    onRedo,
    onSave,
    onSelectAll,
    onCopy,
    onPaste,
    onDelete,
    onDuplicate,
    onRun,
    onImport,
    onExport,
  } = handlers;

  const handleKeyDown = useCallback((event) => {
    const { key, ctrlKey, metaKey, shiftKey } = event;
    const isModifierPressed = ctrlKey || metaKey; // Support both Ctrl (Windows/Linux) and Cmd (Mac)

    // Prevent default browser shortcuts when our shortcuts are active
    const preventDefault = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    // Undo: Ctrl+Z
    if (isModifierPressed && key === 'z' && !shiftKey && onUndo) {
      preventDefault();
      onUndo();
      return;
    }

    // Redo: Ctrl+Y or Ctrl+Shift+Z
    if (((isModifierPressed && key === 'y') || (isModifierPressed && shiftKey && key === 'z')) && onRedo) {
      preventDefault();
      onRedo();
      return;
    }

    // Save: Ctrl+S
    if (isModifierPressed && key === 's' && onSave) {
      preventDefault();
      onSave();
      return;
    }

    // Select All: Ctrl+A
    if (isModifierPressed && key === 'a' && onSelectAll) {
      preventDefault();
      onSelectAll();
      return;
    }

    // Copy: Ctrl+C
    if (isModifierPressed && key === 'c' && onCopy) {
      preventDefault();
      onCopy();
      return;
    }

    // Paste: Ctrl+V
    if (isModifierPressed && key === 'v' && onPaste) {
      preventDefault();
      onPaste();
      return;
    }

    // Delete: Delete key
    if (key === 'Delete' && onDelete) {
      preventDefault();
      onDelete();
      return;
    }

    // Duplicate: Ctrl+D
    if (isModifierPressed && key === 'd' && onDuplicate) {
      preventDefault();
      onDuplicate();
      return;
    }

    // Run Test: Ctrl+Enter or F5
    if (((isModifierPressed && key === 'Enter') || key === 'F5') && onRun) {
      preventDefault();
      onRun();
      return;
    }

    // Import: Ctrl+O
    if (isModifierPressed && key === 'o' && onImport) {
      preventDefault();
      onImport();
      return;
    }

    // Export: Ctrl+E
    if (isModifierPressed && key === 'e' && onExport) {
      preventDefault();
      onExport();
      return;
    }

    // Escape: Clear selection or close modals
    if (key === 'Escape' && handlers.onEscape) {
      preventDefault();
      handlers.onEscape();
      return;
    }
  }, [handlers, onUndo, onRedo, onSave, onSelectAll, onCopy, onPaste, onDelete, onDuplicate, onRun, onImport, onExport]);

  useEffect(() => {
    // Add event listener to document to capture shortcuts globally
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Return shortcut information for displaying in UI
  const shortcuts = {
    undo: { keys: ['Ctrl', 'Z'], description: 'Geri al' },
    redo: { keys: ['Ctrl', 'Y'], description: 'İleri al' },
    save: { keys: ['Ctrl', 'S'], description: 'Kaydet' },
    selectAll: { keys: ['Ctrl', 'A'], description: 'Tümünü seç' },
    copy: { keys: ['Ctrl', 'C'], description: 'Kopyala' },
    paste: { keys: ['Ctrl', 'V'], description: 'Yapıştır' },
    delete: { keys: ['Delete'], description: 'Sil' },
    duplicate: { keys: ['Ctrl', 'D'], description: 'Çoğalt' },
    run: { keys: ['Ctrl', 'Enter'], description: 'Testi çalıştır' },
    runF5: { keys: ['F5'], description: 'Testi çalıştır' },
    import: { keys: ['Ctrl', 'O'], description: 'İçe aktar' },
    export: { keys: ['Ctrl', 'E'], description: 'Dışa aktar' },
    escape: { keys: ['Esc'], description: 'İptal / Seçimi temizle' },
  };

  return {
    shortcuts,
    formatShortcut: (shortcut) => shortcut.keys.join(' + '),
  };
};

export default useKeyboardShortcuts; 