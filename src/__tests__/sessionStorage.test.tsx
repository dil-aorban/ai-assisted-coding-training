import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadTodos, saveTodos, isValidTodos, clearTodos } from '../utils/sessionStorage';
import type { Todo } from '../types/Todo';

// Mock sessionStorage
const store = new Map<string, string>();

const mockGetItem = vi.fn((key: string): string | null => store.get(key) ?? null);
const mockSetItem = vi.fn((key: string, value: string): void => {
  if (value.length > 500) {
    // Simulate quota exceeded with higher threshold
    const error = new DOMException('QuotaExceededError', 'QuotaExceededError');
    throw error;
  }
  store.set(key, value);
});
const mockRemoveItem = vi.fn((key: string): void => {
  store.delete(key);
});
const mockClear = vi.fn((): void => {
  store.clear();
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: mockRemoveItem,
    clear: mockClear,
    length: 0,
    key: vi.fn(),
  },
});

describe('sessionStorage utilities', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  describe('isValidTodos', () => {
    it('should return true for valid todos array', () => {
      const validTodos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date(),
        },
      ];

      expect(isValidTodos(validTodos)).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(isValidTodos([])).toBe(true);
    });

    it('should return false for non-array values', () => {
      expect(isValidTodos(null)).toBe(false);
      expect(isValidTodos(undefined)).toBe(false);
      expect(isValidTodos('not an array')).toBe(false);
      expect(isValidTodos(42)).toBe(false);
      expect(isValidTodos({})).toBe(false);
    });

    it('should return false for array with invalid todo objects', () => {
      const invalidTodos = [
        { id: 'missing-fields' },
        {
          id: 1, // should be string
          title: 'Test',
          description: 'Test',
          completed: false,
          createdAt: new Date(),
        },
        {
          id: '3',
          title: 'Test',
          description: 'Test',
          completed: 'not-boolean', // should be boolean
          createdAt: new Date(),
        },
      ];

      expect(isValidTodos(invalidTodos)).toBe(false);
    });

    it('should return true for todos with string createdAt', () => {
      const todosWithStringDates = [
        {
          id: '1',
          title: 'Test',
          description: 'Test',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ];

      expect(isValidTodos(todosWithStringDates)).toBe(true);
    });
  });

  describe('loadTodos', () => {
    it('should return empty array when no data in storage', () => {
      const result = loadTodos();
      expect(result).toEqual([]);
    });

    it('should load and parse valid todos from storage', () => {
      const todos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date('2023-01-01'),
        },
      ];

      store.set('todos', JSON.stringify(todos));

      const result = loadTodos();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].title).toBe('Test Todo');
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('should return empty array and clear storage on corrupt JSON', () => {
      store.set('todos', 'invalid-json{');

      const result = loadTodos();
      expect(result).toEqual([]);
      expect(mockRemoveItem).toHaveBeenCalledWith('todos');
    });

    it('should return empty array and clear storage on invalid todo structure', () => {
      const invalidData = [{ id: 'incomplete' }];
      store.set('todos', JSON.stringify(invalidData));

      const result = loadTodos();
      expect(result).toEqual([]);
      expect(mockRemoveItem).toHaveBeenCalledWith('todos');
    });

    it('should handle storage access errors gracefully', () => {
      mockGetItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const result = loadTodos();
      expect(result).toEqual([]);
      expect(mockRemoveItem).toHaveBeenCalledWith('todos');
    });
  });

  describe('saveTodos', () => {
    it('should save todos to storage successfully', () => {
      const todos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date(),
        },
      ];

      const result = saveTodos(todos);
      expect(result).toBe(true);
      expect(mockSetItem).toHaveBeenCalledWith('todos', JSON.stringify(todos));
    });

    it('should return false on quota exceeded error', () => {
      // Create a large todo that will trigger quota exceeded
      const largeTodos: Todo[] = Array.from({ length: 20 }, (_, i) => ({
        id: i.toString(),
        title: 'A'.repeat(50), // Long title to exceed our mock quota
        description: 'B'.repeat(50),
        completed: false,
        createdAt: new Date(),
      }));

      const result = saveTodos(largeTodos);
      expect(result).toBe(false);
    });

    it('should handle other storage errors', () => {
      mockSetItem.mockImplementation(() => {
        throw new Error('Generic storage error');
      });

      const todos: Todo[] = [
        {
          id: '1',
          title: 'Test',
          description: 'Test',
          completed: false,
          createdAt: new Date(),
        },
      ];

      const result = saveTodos(todos);
      expect(result).toBe(false);
    });
  });

  describe('clearTodos', () => {
    it('should clear todos from storage', () => {
      store.set('todos', 'some-data');

      clearTodos();
      expect(mockRemoveItem).toHaveBeenCalledWith('todos');
    });

    it('should handle storage errors gracefully', () => {
      mockRemoveItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => clearTodos()).not.toThrow();
    });
  });
});
