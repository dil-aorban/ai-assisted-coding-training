import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoProvider } from '../contexts/TodoContext';
import { useTodo } from '../hooks/useTodo';
import { vi, beforeEach, afterEach } from 'vitest';
import * as sessionStorageUtils from '../utils/sessionStorage';

// Mock the sessionStorage utilities
vi.mock('../utils/sessionStorage', () => ({
  loadTodos: vi.fn(),
  saveTodos: vi.fn(),
  clearTodos: vi.fn(),
}));

const TestComponent = () => {
  const { todos, addTodo, toggleTodoCompletion, deleteTodo, storageError } = useTodo();

  return (
    <div>
      <button data-testid="add-todo" onClick={() => addTodo('Test Todo', 'Test Description')}>
        Add Todo
      </button>
      <div data-testid="todo-count">{todos.length}</div>
      <div data-testid="storage-error">{storageError || 'No error'}</div>
      {todos.map(todo => (
        <div key={todo.id} data-testid={`todo-item-${todo.id}`}>
          <span data-testid={`todo-title-${todo.id}`}>{todo.title}</span>
          <button data-testid={`toggle-${todo.id}`} onClick={() => toggleTodoCompletion(todo.id)}>
            Toggle
          </button>
          <button data-testid={`delete-${todo.id}`} onClick={() => deleteTodo(todo.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

describe('TodoContext with sessionStorage', () => {
  const mockLoadTodos = vi.mocked(sessionStorageUtils.loadTodos);
  const mockSaveTodos = vi.mocked(sessionStorageUtils.saveTodos);

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadTodos.mockReturnValue([]);
    mockSaveTodos.mockReturnValue(true); // Default to success
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should load todos from storage on initialization', () => {
    const existingTodos = [
      {
        id: '1',
        title: 'Existing Todo',
        description: 'From storage',
        completed: false,
        createdAt: new Date(),
      },
    ];

    mockLoadTodos.mockReturnValue(existingTodos);

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    expect(mockLoadTodos).toHaveBeenCalled();
    expect(screen.getByTestId('todo-count').textContent).toBe('1');
    expect(screen.getByText('Existing Todo')).toBeInTheDocument();
  });

  it('should save todos to storage when state changes', async () => {
    const user = userEvent.setup();

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    await user.click(screen.getByTestId('add-todo'));

    await waitFor(() => {
      expect(mockSaveTodos).toHaveBeenCalled();
    });
  });

  it('should show storage error when save fails', async () => {
    const user = userEvent.setup();

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    // Set up mock to fail after initial render
    mockSaveTodos.mockReturnValue(false);

    await user.click(screen.getByTestId('add-todo'));

    await waitFor(() => {
      expect(screen.getByTestId('storage-error').textContent).toContain('Storage quota exceeded');
    });
  });

  it('should clear storage error after successful save', async () => {
    const user = userEvent.setup();

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    // First save should fail
    mockSaveTodos.mockReturnValueOnce(false);

    await user.click(screen.getByTestId('add-todo'));

    await waitFor(() => {
      expect(screen.getByTestId('storage-error').textContent).toContain('Storage quota exceeded');
    });

    // Reset mock to succeed for next save
    mockSaveTodos.mockReturnValue(true);

    // Add another todo - should succeed and clear error
    await user.click(screen.getByTestId('add-todo'));

    await waitFor(
      () => {
        expect(screen.getByTestId('storage-error').textContent).toBe('No error');
      },
      { timeout: 1000 }
    );
  }, 10000);

  // Note: Auto-clear timeout is tested implicitly through user interaction
  // since testing setTimeout with React's concurrent features is complex
});
