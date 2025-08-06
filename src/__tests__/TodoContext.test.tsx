import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoProvider } from '../contexts/TodoContext';
import { useTodo } from '../hooks/useTodo';
import { vi, beforeEach } from 'vitest';
import * as sessionStorageUtils from '../utils/sessionStorage';

// Mock the sessionStorage utilities to avoid interference between tests
vi.mock('../utils/sessionStorage', () => ({
  loadTodos: vi.fn(),
  saveTodos: vi.fn(),
  clearTodos: vi.fn(),
}));

const TestComponent = () => {
  const { todos, addTodo, toggleTodoCompletion, deleteTodo } = useTodo();

  return (
    <div>
      <button data-testid="add-todo" onClick={() => addTodo('Test Todo', 'Test Description')}>
        Add Todo
      </button>
      <div data-testid="todo-count">{todos.length}</div>
      {todos.map(todo => (
        <div key={todo.id} data-testid={`todo-item-${todo.id}`}>
          <span data-testid={`todo-title-${todo.id}`}>{todo.title}</span>
          <span data-testid={`todo-desc-${todo.id}`}>{todo.description}</span>
          <span data-testid={`todo-completed-${todo.id}`}>
            {todo.completed ? 'Completed' : 'Not completed'}
          </span>
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

describe('TodoContext', () => {
  const mockLoadTodos = vi.mocked(sessionStorageUtils.loadTodos);
  const mockSaveTodos = vi.mocked(sessionStorageUtils.saveTodos);

  beforeEach(() => {
    // Reset mocks and ensure clean state
    vi.clearAllMocks();
    mockLoadTodos.mockReturnValue([]);
    mockSaveTodos.mockReturnValue(true);
  });

  it('provides empty todos array initially', () => {
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    expect(screen.getByTestId('todo-count').textContent).toBe('0');
  });

  it('can add a new todo', async () => {
    const user = userEvent.setup();

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    await user.click(screen.getByTestId('add-todo'));

    expect(screen.getByTestId('todo-count').textContent).toBe('1');
    expect(screen.getByText('Test Todo')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('can toggle todo completion status', async () => {
    const user = userEvent.setup();

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    await user.click(screen.getByTestId('add-todo'));

    // Get the first todo's ID
    const todoItem = screen.getByText('Test Todo').closest('[data-testid^="todo-item-"]');
    const todoId = todoItem?.getAttribute('data-testid')?.replace('todo-item-', '');

    expect(todoId).toBeTruthy();
    expect(screen.getByTestId(`todo-completed-${todoId}`).textContent).toBe('Not completed');

    await user.click(screen.getByTestId(`toggle-${todoId}`));

    expect(screen.getByTestId(`todo-completed-${todoId}`).textContent).toBe('Completed');
  });

  it('can delete a todo', async () => {
    const user = userEvent.setup();

    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    await user.click(screen.getByTestId('add-todo'));

    expect(screen.getByTestId('todo-count').textContent).toBe('1');

    // Get the first todo's ID
    const todoItem = screen.getByText('Test Todo').closest('[data-testid^="todo-item-"]');
    const todoId = todoItem?.getAttribute('data-testid')?.replace('todo-item-', '');

    expect(todoId).toBeTruthy();

    await user.click(screen.getByTestId(`delete-${todoId}`));

    expect(screen.getByTestId('todo-count').textContent).toBe('0');
  });
});
