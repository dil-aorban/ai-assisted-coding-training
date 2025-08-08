import React, { useState, useEffect, useRef } from 'react';
import type { Todo } from '../types/Todo';
import { v4 as uuidv4 } from 'uuid';
import { TodoContext } from './TodoContextType';
import { loadTodos, saveTodos } from '../utils/sessionStorage';

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with todos from sessionStorage
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  const [storageError, setStorageError] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  // Persist todos to sessionStorage whenever they change
  useEffect(() => {
    // Skip saving on initial render (when loading from storage)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const success = saveTodos(todos);
    if (!success) {
      setStorageError('Storage quota exceeded — your latest changes may not be saved.');
      // Clear error after 5 seconds
      timeoutId = setTimeout(() => setStorageError(null), 5000);
    } else {
      // Clear error if save was successful
      setStorageError(null);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [todos]);

  const addTodo = (title: string, description: string, dueDate?: string) => {
    const newTodo: Todo = {
      id: uuidv4(),
      title,
      description,
      completed: false,
      createdAt: new Date(),
      ...(dueDate && { dueDate }), // Only include dueDate if provided
    };
    setTodos([...todos, newTodo]);
  };

  const editTodo = (id: string, updates: Partial<Todo>) => {
    setTodos(todos.map(todo => (todo.id === id ? { ...todo, ...updates } : todo)));
  };

  const toggleTodoCompletion = (id: string) => {
    setTodos(todos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <TodoContext.Provider
      value={{ todos, addTodo, editTodo, toggleTodoCompletion, deleteTodo, storageError }}
    >
      {children}
    </TodoContext.Provider>
  );
};

// No re-exports to avoid react-refresh/only-export-components error
