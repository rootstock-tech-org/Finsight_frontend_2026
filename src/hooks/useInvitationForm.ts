import { useState, useEffect, useCallback } from 'react';
import { invitationService, InvitationFormState, TokenValidationResponse } from '@/lib/services/invitation-service';

export interface UseInvitationFormOptions {
  token?: string;
  autoLoad?: boolean;
  autoSave?: boolean;
  saveDelay?: number;
}

export function useInvitationForm(options: UseInvitationFormOptions = {}) {
  const {
    token: providedToken,
    autoLoad = true,
    autoSave = true,
    saveDelay = 2000
  } = options;

  const [token, setToken] = useState<string | null>(providedToken || null);
  const [formState, setFormState] = useState<InvitationFormState | null>(null);
  const [validation, setValidation] = useState<TokenValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Extract token from URL if not provided
  useEffect(() => {
    if (!token && !providedToken) {
      const extractedToken = invitationService.constructor.extractToken();
      if (extractedToken) {
        setToken(extractedToken);
      }
    }
  }, [token, providedToken]);

  // Validate token
  const validateToken = useCallback(async (tokenToValidate: string) => {
    setLoading(true);
    setError(null);

    try {
      const validation = await invitationService.validateToken(tokenToValidate);
      setValidation(validation);

      if (!validation.valid) {
        setError(validation.error || 'Invalid token');
        return false;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Token validation failed';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load form state
  const loadFormState = useCallback(async (tokenToLoad: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await invitationService.getFormState(tokenToLoad);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setFormState(result.formState || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load form state';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save form state
  const saveFormState = useCallback(async (
    formData: any,
    step: string,
    completed: boolean = false
  ) => {
    if (!token) {
      setError('No token available for saving');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await invitationService.saveFormState(token, formData, step, completed);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setFormState(result.formState || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save form state';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [token]);

  // Update form state
  const updateFormState = useCallback(async (updates: {
    form_data?: any;
    step?: string;
    completed?: boolean;
  }) => {
    if (!token) {
      setError('No token available for updating');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await invitationService.updateFormState(token, updates);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setFormState(result.formState || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update form state';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [token]);

  // Auto-save with debouncing
  const autoSaveFormState = useCallback((
    formData: any,
    step: string,
    completed: boolean = false
  ) => {
    if (!autoSave || !token) return;

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      saveFormState(formData, step, completed);
    }, saveDelay);

    setSaveTimeout(timeout);
  }, [autoSave, token, saveFormState, saveDelay, saveTimeout]);

  // Delete form state
  const deleteFormState = useCallback(async () => {
    if (!token) {
      setError('No token available for deletion');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await invitationService.deleteFormState(token);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setFormState(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete form state';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initialize form
  useEffect(() => {
    if (token && autoLoad) {
      const initialize = async () => {
        const isValid = await validateToken(token);
        if (isValid) {
          await loadFormState(token);
        }
      };
      initialize();
    }
  }, [token, autoLoad, validateToken, loadFormState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  return {
    token,
    formState,
    validation,
    loading,
    saving,
    error,
    setToken,
    validateToken,
    loadFormState,
    saveFormState,
    updateFormState,
    autoSaveFormState,
    deleteFormState,
    isTokenValid: validation?.valid || false,
    isAuthenticated: validation?.valid || false,
    userId: validation?.userId,
    email: validation?.email
  };
}
