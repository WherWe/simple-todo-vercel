"use client";

import { useState, useEffect } from "react";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Load todos from API on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      setNeedsSetup(false);
      const response = await fetch("/api/todos");

      if (response.status === 503) {
        const errorData = await response.json();
        if (errorData.needsSetup) {
          setNeedsSetup(true);
          setError("Database needs to be initialized. Click the button below to set it up.");
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }
      const todosData = await response.json();
      setTodos(todosData);
    } catch (err) {
      setError("Failed to load todos");
      console.error("Error fetching todos:", err);
    } finally {
      setLoading(false);
    }
  };

  const setupDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/setup", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to setup database");
      }

      const result = await response.json();
      console.log(result.message);

      // After successful setup, try to fetch todos again
      await fetchTodos();
      setNeedsSetup(false);
    } catch (err) {
      setError("Failed to setup database");
      console.error("Error setting up database:", err);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (inputText.trim() !== "") {
      try {
        const response = await fetch("/api/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: inputText.trim() }),
        });

        if (!response.ok) {
          throw new Error("Failed to create todo");
        }

        const newTodo = await response.json();
        setTodos([newTodo, ...todos]);
        setInputText("");
      } catch (err) {
        setError("Failed to add todo");
        console.error("Error adding todo:", err);
      }
    }
  };

  const toggleTodo = async (id: number) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: !todo.completed }),
      });

      if (!response.ok) {
        throw new Error("Failed to update todo");
      }

      const updatedTodo = await response.json();
      setTodos(todos.map((t) => (t.id === id ? updatedTodo : t)));
    } catch (err) {
      setError("Failed to update todo");
      console.error("Error updating todo:", err);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete todo");
      }

      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (err) {
      setError("Failed to delete todo");
      console.error("Error deleting todo:", err);
    }
  };

  const startEdit = (id: number, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const saveEdit = async (id: number) => {
    if (editText.trim() !== "") {
      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: editText.trim() }),
        });

        if (!response.ok) {
          throw new Error("Failed to update todo");
        }

        const updatedTodo = await response.json();
        setTodos(todos.map((todo) => (todo.id === id ? updatedTodo : todo)));
      } catch (err) {
        setError("Failed to update todo");
        console.error("Error updating todo:", err);
      }
    }
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleEditKeyPress = (e: React.KeyboardEvent, id: number) => {
    if (e.key === "Enter") {
      saveEdit(id);
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const clearCompleted = async () => {
    const completedTodos = todos.filter((todo) => todo.completed);

    try {
      // Delete all completed todos
      await Promise.all(completedTodos.map((todo) => fetch(`/api/todos/${todo.id}`, { method: "DELETE" })));

      // Update local state
      setTodos(todos.filter((todo) => !todo.completed));
    } catch (err) {
      setError("Failed to clear completed todos");
      console.error("Error clearing completed todos:", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          {needsSetup && (
            <div className="mt-3">
              <button onClick={setupDatabase} disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed mr-2">
                {loading ? "Setting up..." : "Setup Database"}
              </button>
            </div>
          )}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
            ✕
          </button>
        </div>
      )}

      {/* Input Section */}
      <div className="flex mb-6">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a new todo..."
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-black bg-white"
        />
        <button
          onClick={addTodo}
          disabled={loading || !inputText.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>

      {/* Loading State */}
      {loading && todos.length === 0 && <div className="text-center py-8 text-gray-500">Loading todos...</div>}

      {/* Stats */}
      {totalCount > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          {completedCount} of {totalCount} completed
        </div>
      )}

      {/* Todo List */}
      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No todos yet. Add one above!</p>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className={`flex items-center p-3 border rounded-lg transition-all ${todo.completed ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300"}`}>
              <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />

              {editingId === todo.id ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyPress={(e) => handleEditKeyPress(e, todo.id)}
                  onBlur={() => saveEdit(todo.id)}
                  className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                  autoFocus
                />
              ) : (
                <span className={`flex-1 cursor-pointer ${todo.completed ? "line-through text-gray-500" : "text-gray-800"}`} onClick={() => startEdit(todo.id, todo.text)} title="Click to edit">
                  {todo.text}
                </span>
              )}

              <div className="flex gap-1 ml-3">
                {editingId === todo.id ? (
                  <>
                    <button onClick={() => saveEdit(todo.id)} className="px-2 py-1 text-green-600 hover:bg-green-50 rounded transition-colors" title="Save">
                      ✓
                    </button>
                    <button onClick={cancelEdit} className="px-2 py-1 text-gray-600 hover:bg-gray-50 rounded transition-colors" title="Cancel">
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(todo.id, todo.text)} className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit todo">
                      ✏️
                    </button>
                    <button onClick={() => deleteTodo(todo.id)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete todo">
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Clear completed button */}
      {completedCount > 0 && (
        <div className="mt-6 text-center">
          <button onClick={clearCompleted} className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
            Clear completed ({completedCount})
          </button>
        </div>
      )}
    </div>
  );
}
