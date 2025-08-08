import React from 'react';
import {
  ListItem,
  ListItemText,
  IconButton,
  Checkbox,
  Divider,
  Typography,
  Box,
} from '@mui/material';
import { format } from 'date-fns';
import type { Todo } from '../../types/Todo';
import { useTodo } from '../../hooks/useTodo';

interface TodoItemProps {
  todo: Todo;
  onEditClick: (todo: Todo) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onEditClick }) => {
  const { toggleTodoCompletion, deleteTodo } = useTodo();

  const getDueDateColor = (dueDate?: string) => {
    if (!dueDate) return 'inherit';

    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
    due.setHours(0, 0, 0, 0);

    const isOverdue = due < today;
    const isDueToday = due.getTime() === today.getTime();

    if (isOverdue) return 'error.main';
    if (isDueToday) return 'warning.main';
    return 'text.secondary';
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;
    try {
      return format(new Date(dueDate), 'PP'); // e.g., "Jan 15, 2025"
    } catch {
      console.warn('Invalid due date format:', dueDate);
      return null;
    }
  };

  return (
    <>
      <ListItem
        sx={{
          bgcolor: 'background.paper',
          py: 1,
          borderLeft: todo.completed ? '4px solid green' : '4px solid transparent',
          '&:hover': {
            bgcolor: 'action.hover',
            cursor: 'pointer',
          },
        }}
        onClick={() => onEditClick(todo)}
        secondaryAction={
          <IconButton
            edge="end"
            aria-label="delete"
            onClick={e => {
              e.stopPropagation();
              deleteTodo(todo.id);
            }}
          >
            Delete
          </IconButton>
        }
      >
        <Checkbox
          edge="start"
          checked={todo.completed}
          onClick={e => {
            e.stopPropagation();
            toggleTodoCompletion(todo.id);
          }}
          color="primary"
          sx={{ mr: 1 }}
        />
        <ListItemText
          disableTypography
          primary={
            <Typography
              variant="body1"
              sx={{
                textDecoration: todo.completed ? 'line-through' : 'none',
                color: todo.completed ? 'text.secondary' : 'text.primary',
                fontWeight: 500,
              }}
            >
              {todo.title}
            </Typography>
          }
          secondary={
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  textDecoration: todo.completed ? 'line-through' : 'none',
                }}
              >
                {todo.description}
              </Typography>
              {todo.dueDate && (
                <Typography
                  variant="caption"
                  sx={{
                    color: getDueDateColor(todo.dueDate),
                    fontWeight: 500,
                    display: 'block',
                    mt: 0.5,
                  }}
                >
                  Due: {formatDueDate(todo.dueDate)}
                </Typography>
              )}
            </Box>
          }
        />
      </ListItem>
      <Divider />
    </>
  );
};
