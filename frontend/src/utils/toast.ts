import toast, { Toaster, ToastOptions } from 'react-hot-toast';

// Default toast configuration
const defaultToastOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '2px solid var(--border-secondary)',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '14px',
    fontWeight: '500',
    maxWidth: '500px'
  }
};

// Success toast
export const toastSuccess = (message: string, options?: ToastOptions) => {
  return toast.success(message, {
    ...defaultToastOptions,
    icon: '✅',
    style: {
      ...defaultToastOptions.style,
      borderColor: 'var(--color-success)'
    },
    ...options
  });
};

// Error toast
export const toastError = (message: string, options?: ToastOptions) => {
  return toast.error(message, {
    ...defaultToastOptions,
    icon: '❌',
    duration: 6000, // Errors stay longer
    style: {
      ...defaultToastOptions.style,
      borderColor: 'var(--color-error)'
    },
    ...options
  });
};

// Info toast
export const toastInfo = (message: string, options?: ToastOptions) => {
  return toast(message, {
    ...defaultToastOptions,
    icon: 'ℹ️',
    style: {
      ...defaultToastOptions.style,
      borderColor: 'var(--color-accent)'
    },
    ...options
  });
};

// Warning toast
export const toastWarning = (message: string, options?: ToastOptions) => {
  return toast(message, {
    ...defaultToastOptions,
    icon: '⚠️',
    style: {
      ...defaultToastOptions.style,
      borderColor: 'var(--color-warning)'
    },
    ...options
  });
};

// Loading toast (returns a toast ID for later update/dismiss)
export const toastLoading = (message: string, options?: ToastOptions) => {
  return toast.loading(message, {
    ...defaultToastOptions,
    duration: Infinity, // Loading toasts don't auto-dismiss
    ...options
  });
};

// Promise toast - automatically shows loading, success, or error based on promise result
export const toastPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  },
  options?: ToastOptions
) => {
  return toast.promise(
    promise,
    messages,
    {
      ...defaultToastOptions,
      ...options,
      loading: {
        ...defaultToastOptions,
        ...options
      },
      success: {
        ...defaultToastOptions,
        icon: '✅',
        style: {
          ...defaultToastOptions.style,
          borderColor: 'var(--color-success)'
        },
        ...options
      },
      error: {
        ...defaultToastOptions,
        icon: '❌',
        duration: 6000,
        style: {
          ...defaultToastOptions.style,
          borderColor: 'var(--color-error)'
        },
        ...options
      }
    }
  );
};

// Update an existing toast (useful for loading -> success/error transitions)
export const toastUpdate = (toastId: string, message: string, type: 'success' | 'error' | 'loading', options?: ToastOptions) => {
  const updateOptions: ToastOptions = {
    ...defaultToastOptions,
    ...options
  };

  switch (type) {
    case 'success':
      return toast.success(message, { ...updateOptions, id: toastId, icon: '✅' });
    case 'error':
      return toast.error(message, { ...updateOptions, id: toastId, icon: '❌', duration: 6000 });
    case 'loading':
      return toast.loading(message, { ...updateOptions, id: toastId });
    default:
      return toast(message, { ...updateOptions, id: toastId });
  }
};

// Dismiss a specific toast or all toasts
export const toastDismiss = (toastId?: string) => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss(); // Dismiss all
  }
};

// Transaction toasts - specialized for blockchain transactions
export const toastTransaction = {
  pending: (txHash?: string) => {
    const message = txHash
      ? `Transaction pending... ${txHash.substring(0, 10)}...`
      : 'Transaction pending...';
    return toastLoading(message);
  },

  success: (txHash?: string, message = 'Transaction successful!') => {
    const fullMessage = txHash
      ? `${message}\nTx: ${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 6)}`
      : message;
    return toastSuccess(fullMessage);
  },

  error: (error: any, fallbackMessage = 'Transaction failed') => {
    const errorMessage = error?.message || error?.toString() || fallbackMessage;
    return toastError(errorMessage);
  }
};

// Export the Toaster component for use in App
export { Toaster };

// Export toast types
export type { ToastOptions };
