import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CheckCircle, X, AlertCircle, Circle } from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  description?: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
}

interface TodoSystemProps {
  className?: string;
}

const TodoSystem: React.FC<TodoSystemProps> = ({ className = '' }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [undoTimer, setUndoTimer] = useState<string | null>(null);
  const [removedTodo, setRemovedTodo] = useState<Todo | null>(null);

  const priorityColors = {
    low: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    medium: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    high: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
  };

  const addTodo = () => {
    if (!newTodo.title.trim()) return;

    const todo: Todo = {
      id: Date.now().toString(),
      title: newTodo.title,
      description: newTodo.description,
      deadline: newTodo.deadline,
      priority: newTodo.priority,
      completed: false,
      createdAt: new Date().toISOString()
    };

    setTodos([todo, ...todos]);
    setNewTodo({ title: '', description: '', deadline: '', priority: 'medium' });
    setShowAddTodo(false);
  };

  const toggleTodo = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    if (!todo.completed) {
      // Mark as completed and start removal process
      setTodos(todos.map(t => t.id === id ? { ...t, completed: true } : t));
      
      // Set up undo timer
      setRemovedTodo(todo);
      setUndoTimer(id);
      
      setTimeout(() => {
        if (undoTimer === id) {
          setTodos(prev => prev.filter(t => t.id !== id));
          setUndoTimer(null);
          setRemovedTodo(null);
        }
      }, 10000);
    }
  };

  const undoRemoval = () => {
    if (removedTodo && undoTimer) {
      setTodos(todos.map(t => t.id === undoTimer ? { ...t, completed: false } : t));
      setUndoTimer(null);
      setRemovedTodo(null);
    }
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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

      {/* Add Todo Form */}
      {showAddTodo && (
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
              Add Task
            </button>
          </div>
        </div>
      )}

      {/* Todo List */}
      <div className="space-y-3">
        {todos.filter(todo => !todo.completed || undoTimer === todo.id).map((todo) => (
          <div
            key={todo.id}
            className={`p-4 border rounded-lg transition-all ${
              todo.completed 
                ? 'border-primary/30 bg-primary/5 opacity-60' 
                : isOverdue(todo.deadline)
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
                <h4 className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {todo.title}
                </h4>
                {todo.description && (
                  <p className={`text-sm mt-1 ${todo.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                    {todo.description}
                  </p>
                )}
                
                <div className="flex items-center space-x-4 mt-2">
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
                </div>
              </div>
            </div>
          </div>
        ))}

        {todos.filter(todo => !todo.completed).length === 0 && (
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