import { useState } from 'react';

export function useFormActionStatus() {
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearStatus = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const setErrorStatus = (message: string) => {
    setSuccessMessage('');
    setErrorMessage(message);
  };

  const setSuccessStatus = (message: string) => {
    setErrorMessage('');
    setSuccessMessage(message);
  };

  return {
    clearStatus,
    errorMessage,
    setErrorStatus,
    setSuccessStatus,
    successMessage,
  };
}
