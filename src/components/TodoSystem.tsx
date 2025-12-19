import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CheckCircle, X, AlertCircle, Circle, User, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssigneeSelector from './AssigneeSelector';

interface Todo {
  id: string;
  title: string;
  description?: string;
  deadline: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  completed: boolean;
  created_at: string;
  created_by: string;
  assigned_to?: string | null;
  assigned_by?: string | null;
  company_page_id?: string | null;
  assigned_user?: {
    full_name: string;
    profile_photo?: string;
  };
}

interface TodoSystemProps {
  className?: string;
  companyPageId?: string;
  isEmployerAdmin?: boolean;
  viewMode?: 'personal' | 'employer-admin';
}

const TodoSystem: React.FC<TodoSystemProps> = ({ 
  className = '',
  companyPageId,
  isEmployerAdmin = false,
  viewMode = 'personal'
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [assignedTodos, setAssignedTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: ''
  });
  const [undoTimer, setUndoTimer] = useState<string | null>(null);
  const [removedTodo, setRemovedTodo] = useState<Todo | null>(null);
  const [activeTab, setActiveTab] = useState('my-tasks');
  const [companyEmployees, setCompanyEmployees] = useState<any[]>([]);

  const priorityColors = {
    low: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    medium: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    high: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
  };

  // Fetch todos from database
  const fetchTodos = async () => {
    if (!user) return;

    try {
      // Fetch user's own todos
      const { data: myTodos, error: myError } = await supabase
        .from('todos')
        .select('*')
        .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (myError) throw myError;
      setTodos((myTodos || []) as Todo[]);

      // If employer admin, fetch todos they assigned
      if (isEmployerAdmin && companyPageId) {
        const { data: assigned, error: assignedError } = await supabase
          .from('todos')
          .select('*')
          .eq('assigned_by', user.id)
          .eq('company_page_id', companyPageId)
          .order('created_at', { ascending: false });

        if (!assignedError && assigned) {
          // Fetch assigned user details separately
          const enrichedAssigned = await Promise.all(
            assigned.map(async (todo) => {
              if (todo.assigned_to) {
                const { data: userData } = await supabase
                  .from('user_profiles')
                  .select('full_name, profile_photo')
                  .eq('id', todo.assigned_to)
                  .single();
                return { ...todo, assigned_user: userData || undefined };
              }
              return todo;
            })
          );
          setAssignedTodos(enrichedAssigned as Todo[]);
        }
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch company employees for assignment
  const fetchCompanyEmployees = async () => {
    if (!companyPageId || !isEmployerAdmin) return;

    try {
      const { data, error } = await supabase
        .from('company_employees')
        .select(`
          user_id,
          role,
          user_profiles:user_id(id, full_name, profile_photo)
        `)
        .eq('company_page_id', companyPageId)
        .neq('user_id', user?.id);

      if (!error && data) {
        setCompanyEmployees(data.map(e => ({
          id: (e.user_profiles as any)?.id,
          name: (e.user_profiles as any)?.full_name || 'Unknown',
          photo: (e.user_profiles as any)?.profile_photo,
          role: e.role
        })));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchTodos();
    fetchCompanyEmployees();
  }, [user, companyPageId, isEmployerAdmin]);

  const addTodo = async () => {
    if (!newTodo.title.trim() || !user) return;

    try {
      const todoData: any = {
        title: newTodo.title,
        description: newTodo.description || null,
        deadline: newTodo.deadline || null,
        priority: newTodo.priority,
        created_by: user.id,
        status: 'pending',
        completed: false
      };

      // If assigning to someone else (employer admin feature)
      if (newTodo.assignedTo && isEmployerAdmin && companyPageId) {
        todoData.assigned_to = newTodo.assignedTo;
        todoData.assigned_by = user.id;
        todoData.company_page_id = companyPageId;
      }

      const { data, error } = await supabase
        .from('todos')
        .insert(todoData)
        .select()
        .single();

      if (error) throw error;

      const newTodoData = data as Todo;

      if (newTodo.assignedTo && isEmployerAdmin) {
        setAssignedTodos([newTodoData, ...assignedTodos]);
        toast({
          title: 'Task Assigned',
          description: 'The task has been assigned successfully.',
        });
      } else {
        setTodos([newTodoData, ...todos]);
        toast({
          title: 'Task Added',
          description: 'Your new task has been created.',
        });
      }

      setNewTodo({ title: '', description: '', deadline: '', priority: 'medium', assignedTo: '' });
      setShowAddTodo(false);
    } catch (error) {
      console.error('Error adding todo:', error);
      toast({
        title: 'Error',
        description: 'Failed to add task. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id) || assignedTodos.find(t => t.id === id);
    if (!todo) return;

    if (!todo.completed) {
      // Mark as completed
      try {
        const { error } = await supabase
          .from('todos')
          .update({ 
            completed: true, 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;

        // Update local state
        setTodos(todos.map(t => t.id === id ? { ...t, completed: true, status: 'completed' } : t));
        setAssignedTodos(assignedTodos.map(t => t.id === id ? { ...t, completed: true, status: 'completed' } : t));
        
        // Set up undo timer
        setRemovedTodo(todo);
        setUndoTimer(id);
        
        setTimeout(() => {
          if (undoTimer === id) {
            setUndoTimer(null);
            setRemovedTodo(null);
          }
        }, 10000);
      } catch (error) {
        console.error('Error completing todo:', error);
      }
    }
  };

  const undoRemoval = async () => {
    if (removedTodo && undoTimer) {
      try {
        const { error } = await supabase
          .from('todos')
          .update({ completed: false, status: 'pending', completed_at: null })
          .eq('id', undoTimer);

        if (error) throw error;

        setTodos(todos.map(t => t.id === undoTimer ? { ...t, completed: false, status: 'pending' } : t));
        setAssignedTodos(assignedTodos.map(t => t.id === undoTimer ? { ...t, completed: false, status: 'pending' } : t));
        setUndoTimer(null);
        setRemovedTodo(null);
      } catch (error) {
        console.error('Error undoing completion:', error);
      }
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTodos(todos.filter(t => t.id !== id));
      setAssignedTodos(assignedTodos.filter(t => t.id !== id));
      toast({
        title: 'Task Deleted',
        description: 'The task has been removed.',
      });
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderTodoItem = (todo: Todo, showAssignee: boolean = false) => (
    <div
      key={todo.id}
      className={`p-4 border rounded-lg transition-all ${
        todo.completed 
          ? 'border-primary/30 bg-primary/5 opacity-60' 
          : todo.deadline && isOverdue(todo.deadline)
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-border hover:border-border/80'
      }`}
    >
      <div className="flex items-start space-x-3">
        <button
          onClick={() => toggleTodo(todo.id)}
          className={`mt-1 ${todo.completed ? 'text-primary' : 'text-muted-foreground hover:text-primary'} transition-colors`}
        >
          {todo.completed ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
        </button>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h4 className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {todo.title}
            </h4>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {todo.description && (
            <p className={`text-sm mt-1 ${todo.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
              {todo.description}
            </p>
          )}
          
          <div className="flex items-center flex-wrap gap-4 mt-2">
            {todo.deadline && (
              <div className={`flex items-center space-x-1 text-xs ${
                isOverdue(todo.deadline) && !todo.completed
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}>
                {isOverdue(todo.deadline) && !todo.completed && <AlertCircle className="h-3 w-3" />}
                <Clock className="h-3 w-3" />
                <span>{formatDate(todo.deadline)}</span>
              </div>
            )}
            
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[todo.priority]}`}>
              {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
            </span>

            {showAssignee && todo.assigned_user && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{todo.assigned_user.full_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddTodoForm = () => (
    <div className="mb-4 p-4 border border-border rounded-lg space-y-3">
      <input
        type="text"
        placeholder="Task title"
        value={newTodo.title}
        onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
      />
      <textarea
        placeholder="Description (optional)"
        value={newTodo.description}
        onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
        rows={2}
      />
      <div className="flex space-x-3">
        <input
          type="datetime-local"
          value={newTodo.deadline}
          onChange={(e) => setNewTodo({ ...newTodo, deadline: e.target.value })}
          className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
        />
        <select
          value={newTodo.priority}
          onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as 'low' | 'medium' | 'high' })}
          className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
      </div>

      {/* Assignment selector for employer admins */}
      {isEmployerAdmin && companyPageId && companyEmployees.length > 0 && (
        <AssigneeSelector
          employees={companyEmployees}
          selectedId={newTodo.assignedTo}
          onChange={(id) => setNewTodo({ ...newTodo, assignedTo: id })}
        />
      )}

      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setShowAddTodo(false)}
          className="px-3 py-2 text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          onClick={addTodo}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {newTodo.assignedTo ? 'Assign Task' : 'Add Task'}
        </button>
      </div>
    </div>
  );

  const myPendingTodos = todos.filter(todo => !todo.completed || undoTimer === todo.id);

  if (loading) {
    return (
      <div className={`bg-card text-card-foreground rounded-xl shadow-sm p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/4"></div>
          <div className="h-16 bg-muted rounded"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Employer admin view with tabs
  if (isEmployerAdmin && viewMode === 'employer-admin' && companyPageId) {
    return (
      <div className={`bg-card text-card-foreground rounded-xl shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Tasks & Todos</h3>
          <button
            onClick={() => setShowAddTodo(!showAddTodo)}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Undo notification */}
        {undoTimer && removedTodo && (
          <div className="mb-4 p-3 bg-accent/50 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">
                Task completed: "{removedTodo.title}"
              </span>
              <button
                onClick={undoRemoval}
                className="text-sm font-medium text-primary hover:underline"
              >
                Undo
              </button>
            </div>
          </div>
        )}

        {showAddTodo && renderAddTodoForm()}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="my-tasks" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              My Tasks
            </TabsTrigger>
            <TabsTrigger value="team-tasks" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-tasks" className="space-y-3">
            {myPendingTodos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending tasks. Great job!</p>
              </div>
            ) : (
              myPendingTodos.map((todo) => renderTodoItem(todo))
            )}
          </TabsContent>

          <TabsContent value="team-tasks" className="space-y-3">
            {assignedTodos.filter(t => !t.completed).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tasks assigned to team members.</p>
              </div>
            ) : (
              assignedTodos.filter(t => !t.completed).map((todo) => renderTodoItem(todo, true))
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Personal view (default)
  return (
    <div className={`bg-card text-card-foreground rounded-xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Tasks & Todos</h3>
        <button
          onClick={() => setShowAddTodo(!showAddTodo)}
          className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Undo notification */}
      {undoTimer && removedTodo && (
        <div className="mb-4 p-3 bg-accent/50 border border-border rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">
              Task completed: "{removedTodo.title}"
            </span>
            <button
              onClick={undoRemoval}
              className="text-sm font-medium text-primary hover:underline"
            >
              Undo
            </button>
          </div>
        </div>
      )}

      {showAddTodo && renderAddTodoForm()}

      {/* Todo List */}
      <div className="space-y-3">
        {myPendingTodos.map((todo) => renderTodoItem(todo))}

        {myPendingTodos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No pending tasks. Great job!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoSystem;
