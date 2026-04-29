
import { useState, useEffect, useCallback } from 'react';

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  onConfirmClose?: () => void;
}

export function useUnsavedChanges({ hasUnsavedChanges, onConfirmClose }: UseUnsavedChangesOptions) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  // Intercepta o fechamento quando há mudanças não salvas
  const handleClose = useCallback((shouldClose: boolean = false) => {
    if (hasUnsavedChanges && !shouldClose) {
      setShowConfirmDialog(true);
      setPendingClose(true);
      return false; // Não fecha ainda
    }
    return true; // Pode fechar
  }, [hasUnsavedChanges]);

  // Confirma o fechamento (descarta mudanças)
  const confirmClose = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingClose(false);
    if (onConfirmClose) {
      onConfirmClose();
    }
  }, [onConfirmClose]);

  // Cancela o fechamento (volta ao formulário)
  const cancelClose = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingClose(false);
  }, []);

  return {
    showConfirmDialog,
    handleClose,
    confirmClose,
    cancelClose,
    pendingClose
  };
}
