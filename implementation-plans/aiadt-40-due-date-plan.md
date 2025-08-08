# Plan: Add Due Date field to todos

## Context

**Original Request**: AIADT-40 - "CLONE - Add Due Date field to todos"

**Business Value**: Allow users to set and view deadlines for tasks, enabling better prioritization and time-management.

**Scope**:

- Extend Todo data model with optional due date
- Persist due date to sessionStorage
- UI: Add date picker to create/edit modal, display due date in list
- Basic validation and graceful handling of missing/invalid values
- Update unit tests

**Out of Scope**:

- Reminder notifications, calendar sync, automatic sorting
- API/backend persistence (future work)

**Related System Components**:

- Todo data model: `src/types/Todo.ts`
- Todo context and state management: `src/contexts/TodoContext.tsx`
- Storage utilities: `src/utils/sessionStorage.ts`
- UI components: `src/components/TodoModal/TodoModal.tsx`, `src/components/TodoList/TodoItem.tsx`
- Application wrapper: `src/App.tsx`

**Technical Requirements**:

- Use `@mui/x-date-pickers` DatePicker with `AdapterDateFns`
- Store dates as ISO 8601 strings
- Display dates using `date-fns` format with pattern `'PP'`
- Visual indicators: red for overdue, amber for due today
- Backward compatibility with existing todos

## Task List

### Task 1: Install Required Dependencies

**Status**: DONE
**Depends On**: None
**Description**:
Add the necessary date picker and formatting libraries to the project.
Install `@mui/x-date-pickers` and `date-fns` packages.

**Code Snippets**:

```bash
npm install @mui/x-date-pickers date-fns
```

**Verification**:

- Dependencies appear in package.json
- Installation completes without errors
- No version conflicts with existing dependencies

### Task 2: Update Todo Type Definition

**Status**: DONE
**Depends On**: None
**Description**:
Extend the Todo interface to include the optional due date field as an ISO 8601 string.

**Code Snippets**:

```typescript
export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  dueDate?: string; // Add this field as ISO 8601 string
}
```

**Verification**:

- TypeScript compilation succeeds without errors
- Todo interface includes optional dueDate field
- Existing code continues to work without modification

### Task 3: Update SessionStorage Utilities

**Status**: DONE
**Depends On**: [2]
**Description**:
Modify storage validation and handling to support the new dueDate field while maintaining backward compatibility with existing stored todos.

**Code Snippets**:

```typescript
// In isValidTodos function, add validation for dueDate:
return value.every(item => {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.description === 'string' &&
    typeof item.completed === 'boolean' &&
    (item.createdAt instanceof Date ||
      (typeof item.createdAt === 'string' && !isNaN(Date.parse(item.createdAt)))) &&
    // Add dueDate validation - optional, but if present, must be valid ISO 8601
    (item.dueDate === undefined ||
      (typeof item.dueDate === 'string' && !isNaN(Date.parse(item.dueDate))))
  );
});
```

**Verification**:

- Existing todos without dueDate load correctly
- New todos with due dates save and load properly
- Invalid dueDate values are handled gracefully
- No data corruption or loss occurs

### Task 4: Setup LocalizationProvider

**Status**: DONE
**Depends On**: [1]
**Description**:
Wrap the application in LocalizationProvider to enable MUI date picker functionality.

**Code Snippets**:

```typescript
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// In App component:
<AtlasThemeProvider>
  <CssBaseline />
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <TodoProvider>
      <AppContent />
    </TodoProvider>
  </LocalizationProvider>
</AtlasThemeProvider>
```

**Verification**:

- Application starts without errors
- Date picker functionality is available
- No console warnings about missing LocalizationProvider

### Task 5: Update TodoContext for Due Date Handling

**Status**: DONE
**Depends On**: [2]
**Description**:
Modify the addTodo and editTodo functions to handle the due date parameter.
Update function signatures and implementation to support optional dueDate.

**Code Snippets**:

```typescript
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
```

**Verification**:

- Context functions compile correctly with new signature
- addTodo handles optional dueDate parameter properly
- editTodo can update dueDate field
- Existing functionality remains unaffected

### Task 6: Enhance TodoModal with Date Picker

**Status**: DONE
**Depends On**: [4, 5]
**Description**:
Add DatePicker component to the TodoModal for selecting due dates during create and edit operations.
Handle date state management and form submission.

**Code Snippets**:

```typescript
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Add state for due date
const [dueDate, setDueDate] = useState<Date | null>(null);

// In useEffect for loading initial values:
if (mode === 'edit' && initialValues) {
  setTitle(initialValues.title);
  setDescription(initialValues.description);
  setCompleted(initialValues.completed);
  setDueDate(initialValues.dueDate ? new Date(initialValues.dueDate) : null);
}

// In form submission:
if (mode === 'create') {
  addTodo(title.trim(), description.trim(), dueDate?.toISOString());
} else if (mode === 'edit' && initialValues) {
  editTodo(initialValues.id, {
    title: title.trim(),
    description: description.trim(),
    completed,
    dueDate: dueDate?.toISOString(),
  });
}

// DatePicker component in form:
<DatePicker
  label="Due Date"
  value={dueDate}
  onChange={(newValue) => setDueDate(newValue)}
  slotProps={{
    textField: {
      fullWidth: true,
      helperText: 'Optional due date for this todo'
    }
  }}
/>
```

**Verification**:

- Date picker appears in both create and edit modes
- Selected dates are properly formatted and saved as ISO strings
- Clearing the date field works correctly
- Form validation handles date picker integration
- Existing modal functionality remains intact

### Task 7: Display Due Dates in TodoItem

**Status**: DONE
**Depends On**: [1, 2]
**Description**:
Update TodoItem component to display due dates with appropriate formatting and visual indicators for overdue/due today items.

**Code Snippets**:

```typescript
import { format } from 'date-fns';

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
  } catch (error) {
    console.warn('Invalid due date format:', dueDate);
    return null;
  }
};

// In TodoItem component JSX:
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
```

**Verification**:

- Due dates display in readable format (e.g., "Jan 15, 2025")
- Color coding works: red for overdue, amber for due today, gray for future
- Layout remains clean and responsive
- Todos without due dates show no additional text
- Invalid dates are handled gracefully

### Task 8: Update Unit Tests

**Status**: DONE
**Depends On**: [2, 3, 5, 6, 7]
**Description**:
Update all existing tests to handle the new dueDate field and add specific tests for due date functionality.

**Code Snippets**:

```typescript
// Example test cases to add:

describe('TodoContext with due dates', () => {
  test('addTodo creates todo with due date', () => {
    const dueDate = '2025-12-31T00:00:00.000Z';
    addTodo('Test todo', 'Test description', dueDate);

    expect(todos).toHaveLength(1);
    expect(todos[0].dueDate).toBe(dueDate);
  });

  test('addTodo creates todo without due date', () => {
    addTodo('Test todo', 'Test description');

    expect(todos).toHaveLength(1);
    expect(todos[0].dueDate).toBeUndefined();
  });
});

describe('sessionStorage with due dates', () => {
  test('validates todos with valid due dates', () => {
    const validTodos = [
      {
        id: '1',
        title: 'Test',
        description: 'Test',
        completed: false,
        createdAt: new Date(),
        dueDate: '2025-12-31T00:00:00.000Z',
      },
    ];
    expect(isValidTodos(validTodos)).toBe(true);
  });

  test('validates todos without due dates', () => {
    const validTodos = [
      { id: '1', title: 'Test', description: 'Test', completed: false, createdAt: new Date() },
    ];
    expect(isValidTodos(validTodos)).toBe(true);
  });
});
```

**Verification**:

- All existing tests continue to pass
- New tests cover due date functionality
- Test coverage remains at or above existing baseline
- Edge cases are properly tested

### Task 9: Integration Testing

**Status**: DONE
**Depends On**: [1, 2, 3, 4, 5, 6, 7, 8]
**Description**:
Perform end-to-end testing to ensure all components work together correctly and all acceptance criteria are met.

**Verification**:

- User can optionally pick a due date when creating a todo
- Existing todos without due date remain unaffected
- Editing a todo shows current due date and allows change or removal
- Due date shows in todo item list with proper formatting
- Validation prevents submission of clearly invalid dates
- Data persists after page refresh
- Legacy stored data without dueDate still loads properly
- Visual indicators work correctly (red for overdue, amber for due today)
- All unit tests pass
- No console errors or warnings
- TypeScript compilation succeeds

## Execution Guide

1. Pick the next task that is not in progress and has all dependencies marked as DONE.
   If multiple tasks are eligible, pick the first one in the list.

2. Execute the selected task:
   a. Set status to IN-PROGRESS
   b. Follow the task description
   c. Complete verification steps
   d. Set status to DONE when verified successfully

3. Continue to the next eligible task until all tasks are completed.

4. For each task:
   - Test functionality individually before proceeding
   - Ensure TypeScript compilation succeeds
   - Run existing tests to catch any regressions
   - Follow existing code style and patterns

5. Success criteria:
   - All acceptance criteria from AIADT-40 are fulfilled
   - Visual design matches specifications
   - Backward compatibility maintained
   - No performance degradation or console errors
