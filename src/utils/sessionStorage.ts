import type { Todo } from '../types/Todo';

const STORAGE_KEY = 'todos';

/**
 * Validates that the given value is a valid array of Todo objects
 */
export const isValidTodos = (value: unknown): value is Todo[] => {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      typeof item.description === 'string' &&
      typeof item.completed === 'boolean' &&
      (item.createdAt instanceof Date || typeof item.createdAt === 'string')
    );
  });
};

/**
 * Loads todos from sessionStorage
 * Returns empty array if no data, corrupt data, or validation fails
 */
export const loadTodos = (): Todo[] => {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    // Validate the parsed data before processing
    if (!isValidTodos(parsed)) {
      console.warn('Invalid todos data found in sessionStorage, clearing and starting fresh');
      window.sessionStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Convert createdAt strings back to Date objects (only if they're strings)
    const todosWithDates = parsed.map(todo => ({
      ...todo,
      createdAt: todo.createdAt instanceof Date ? todo.createdAt : new Date(todo.createdAt),
    }));

    return todosWithDates;
  } catch (error) {
    console.warn('Failed to load todos from sessionStorage:', error);
    // Clear corrupted data
    window.sessionStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

/**
 * Saves todos to sessionStorage
 * Returns true on success, false on failure (e.g., quota exceeded)
 */
export const saveTodos = (todos: Todo[]): boolean => {
  try {
    const serialized = JSON.stringify(todos);
    window.sessionStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('SessionStorage quota exceeded. Latest changes may not be saved.');
      return false;
    }
    console.error('Failed to save todos to sessionStorage:', error);
    return false;
  }
};

/**
 * Clears todos from sessionStorage
 */
export const clearTodos = (): void => {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear todos from sessionStorage:', error);
  }
};
