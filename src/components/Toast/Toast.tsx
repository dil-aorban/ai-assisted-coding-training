import React from 'react';
import { Alert, Snackbar } from '@mui/material';

interface ToastProps {
  message: string | null;
  severity?: 'error' | 'warning' | 'info' | 'success';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, severity = 'warning', onClose }) => {
  return (
    <Snackbar
      open={!!message}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};
