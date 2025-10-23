"use client";

import { useState, useEffect } from "react";

interface Todo {
  id: number;
  text: string;
  completed: boolean;

  // AI-enhanced fields
  tags: string[];
  priority: "high" | "medium" | "low";
  dueDate: string | null;
  context: string | null;
  aiGenerated: boolean;

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

  // AI extraction state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTodos, setExtractedTodos] = useState<any[]>([]);
  const [newTodoIds, setNewTodoIds] = useState<Set<number>>(new Set());

  // Load todos from API on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  // Helper function to group todos by date
  const groupTodosByDate = (todos: Todo[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const groups: Record<string, Todo[]> = {
      Overdue: [],
      Today: [],
      Tomorrow: [],
      "This Week": [],
      Later: [],
      "No Due Date": [],
    };

    todos.forEach((todo) => {
      if (!todo.dueDate) {
        groups["No Due Date"].push(todo);
        return;
      }

      const dueDate = new Date(todo.dueDate);
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

      if (dueDateOnly < today) {
        groups.Overdue.push(todo);
      } else if (dueDateOnly.getTime() === today.getTime()) {
        groups.Today.push(todo);
      } else if (dueDateOnly.getTime() === tomorrow.getTime()) {
        groups.Tomorrow.push(todo);
      } else if (dueDateOnly < weekFromNow) {
        groups["This Week"].push(todo);
      } else {
        groups.Later.push(todo);
      }
    });

    return groups;
  };

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

      // Defensive validation: ensure we received an array of todo objects
      if (!Array.isArray(todosData)) {
        console.error("Invalid todos response, expected array:", todosData);
        setError("Received invalid data from server");
        return;
      }

      // Basic shape validation and filtering of malformed items
      const validated = todosData
        .filter((t: any) => {
          return t && (typeof t.id === "number" || typeof t.id === "string") && typeof t.text === "string" && typeof t.completed === "boolean";
        })
        .map((t: any) => ({
          // Normalize id to number when possible
          id: typeof t.id === "string" ? Number(t.id) : t.id,
          text: String(t.text),
          completed: Boolean(t.completed),
          tags: Array.isArray(t.tags) ? t.tags : [],
          priority: t.priority || "medium",
          dueDate: t.dueDate || null,
          context: t.context || null,
          aiGenerated: Boolean(t.aiGenerated),
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: t.updatedAt || new Date().toISOString(),
        }));

      setTodos(validated as Todo[]);
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

  const extractTodosWithAI = async () => {
    if (inputText.trim() === "") return;

    try {
      setIsExtracting(true);
      setError(null);

      const response = await fetch("/api/ai/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract todos");
      }

      const result = await response.json();
      console.log("AI extracted todos:", result);
      // Validate AI response
      if (!result || !Array.isArray(result.todos)) {
        console.error("AI extraction returned unexpected shape:", result);
        throw new Error("AI returned invalid response");
      }

      // Save each extracted todo to the database
      const savedTodos: Todo[] = [];
      for (const extractedTodo of result.todos) {
        // Basic validation for extracted todo
        if (!extractedTodo || typeof extractedTodo.text !== "string") continue;
        const todoResponse = await fetch("/api/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: extractedTodo.text,
            tags: extractedTodo.tags,
            priority: extractedTodo.priority,
            dueDate: extractedTodo.dueDate,
            context: extractedTodo.context,
            aiGenerated: true,
          }),
        });

        if (todoResponse.ok) {
          const savedTodo = await todoResponse.json();
          // Ensure savedTodo has expected shape
          if (savedTodo && (typeof savedTodo.id === "number" || typeof savedTodo.id === "string") && typeof savedTodo.text === "string") {
            savedTodos.push({
              ...savedTodo,
              id: typeof savedTodo.id === "string" ? Number(savedTodo.id) : savedTodo.id,
            });
          } else {
            console.warn("Saved todo had unexpected shape, skipping:", savedTodo);
          }
        }
      }

      // Add todos with staggered animation
      setExtractedTodos(savedTodos);
      const newIds = new Set<number>();

      for (let i = 0; i < savedTodos.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 400 * i));
        const todo = savedTodos[i];
        newIds.add(todo.id);
        setNewTodoIds((prev) => new Set([...prev, todo.id]));
        setTodos((prev) => [todo, ...prev]);
      }

      // Remove animation class after 1 second
      setTimeout(() => {
        setNewTodoIds(new Set());
      }, 1000);

      setInputText("");
      setExtractedTodos([]);
    } catch (err) {
      setError("Failed to extract todos with AI");
      console.error("Error extracting todos:", err);
    } finally {
      setIsExtracting(false);
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
    // Enter = AI Extract (default)
    // Cmd/Ctrl + Enter = Simple Add
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (e.metaKey || e.ctrlKey) {
        addTodo();
      } else {
        extractTodosWithAI();
      }
    }
  };

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
      {/* Version Info */}
      <div className="text-xs text-gray-400 mb-2 text-right">Last updated: {new Date().toISOString().slice(0, 19).replace("T", " ")} UTC</div>

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

      {/* Two Column Layout - Desktop: Chat Left | Todos Right, Mobile: Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN - Chat Input Section */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div
            className={`transition-all duration-500 ease-out ${
              isExtracting ? "scale-[1.02] ring-4 ring-purple-400 ring-opacity-40 shadow-2xl shadow-purple-200" : "shadow-lg hover:shadow-xl"
            } rounded-2xl bg-gradient-to-br from-white to-gray-50 p-6`}
          >
            <div className="space-y-4">
              {/* Large Textarea Input */}
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isExtracting ? "✨ AI is working its magic..." : "What's on your mind? Add a single todo or ramble about everything you need to do..."}
                disabled={loading || isExtracting}
                rows={3}
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 text-black bg-white text-base resize-none transition-all duration-300 ${
                  isExtracting ? "animate-pulse border-purple-300 bg-purple-50" : "hover:border-gray-300"
                }`}
                style={{ minHeight: "90px" }}
              />

              {/* AI Extracting Indicator */}
              {isExtracting && (
                <div className="flex items-center gap-3 text-purple-600 animate-pulse bg-purple-50 px-4 py-3 rounded-lg">
                  <div className="relative">
                    <span className="text-2xl animate-bounce">🤖</span>
                    <span className="absolute inset-0 text-2xl animate-ping opacity-30">✨</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">AI is analyzing your thoughts...</p>
                    <p className="text-xs text-purple-500">Extracting todos, assigning tags, priorities, and dates</p>
                  </div>
                </div>
              )}

              {/* Button Row */}
              <div className="flex gap-2">
                <button
                  onClick={addTodo}
                  disabled={loading || isExtracting || !inputText.trim()}
                  className="flex-1 px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 font-medium rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 shadow-sm hover:shadow-md transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? "Adding..." : "Add Simple Todo"}
                </button>
                <button
                  onClick={extractTodosWithAI}
                  disabled={loading || isExtracting || !inputText.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  {isExtracting ? (
                    <>
                      <span className="animate-spin text-lg">✨</span>
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">✨</span>
                      <span>AI Extract</span>
                    </>
                  )}
                </button>
              </div>

              {/* Helper Text */}
              {!isExtracting && (
                <p className="text-sm text-gray-600 text-center leading-relaxed space-x-1">
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-xs font-mono shadow-sm">Enter</kbd>
                    <span className="text-gray-500">AI extract</span>
                  </span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-xs font-mono shadow-sm">⌘+Enter</kbd>
                    <span className="text-gray-500">simple add</span>
                  </span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-xs font-mono shadow-sm">Shift+Enter</kbd>
                    <span className="text-gray-500">new line</span>
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Todo List Section */}
        <div className="space-y-4">
          {/* Loading State */}
          {loading && todos.length === 0 && <div className="text-center py-8 text-gray-500">Loading todos...</div>}

          {/* Stats */}
          {totalCount > 0 && (
            <div className="text-sm text-gray-600">
              {completedCount} of {totalCount} completed
            </div>
          )}

          {/* Todo List */}
          <div className="space-y-6">
            {todos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No todos yet. Add one above!</p>
            ) : (
              (() => {
                const groupedTodos = groupTodosByDate(todos);
                const groupOrder = ["Overdue", "Today", "Tomorrow", "This Week", "Later", "No Due Date"];

                return groupOrder.map((groupName) => {
                  const groupTodos = groupedTodos[groupName];
                  if (groupTodos.length === 0) return null;

                  return (
                    <div key={groupName} className="space-y-2">
                      {/* Group Header */}
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-semibold uppercase tracking-wide ${groupName === "Overdue" ? "text-red-600" : groupName === "Today" ? "text-purple-600" : "text-gray-600"}`}>
                          {groupName}
                          <span className="ml-2 text-xs font-normal text-gray-500">({groupTodos.length})</span>
                        </h3>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>

                      {/* Todos in this group */}
                      {groupTodos.map((todo) => (
                        <div
                          key={todo.id}
                          className={`border rounded-lg transition-all ${newTodoIds.has(todo.id) ? "todo-appear" : ""} ${todo.completed ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300"} ${
                            todo.aiGenerated ? "border-l-4 border-l-purple-400 shadow-md" : ""
                          }`}
                        >
                          <div className="flex items-center p-3">
                            <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />

                            {editingId === todo.id ? (
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyPress={(e) => handleEditKeyPress(e, todo.id)}
                                onBlur={() => saveEdit(todo.id)}
                                autoFocus
                                className="flex-1 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-base"
                              />
                            ) : (
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`cursor-pointer ${todo.completed ? "line-through text-gray-500" : "text-gray-800"}`}
                                    onClick={() => startEdit(todo.id, todo.text)}
                                    title="Click to edit"
                                  >
                                    {todo.text}
                                  </span>
                                  {todo.aiGenerated && (
                                    <span className="text-xs text-purple-500" title="AI Generated">
                                      ✨
                                    </span>
                                  )}
                                  {todo.priority === "high" && <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">High</span>}
                                  {todo.priority === "low" && <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full">Low</span>}
                                </div>
                                {(todo.tags.length > 0 || todo.dueDate || todo.context) && (
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                    {todo.tags.map((tag) => (
                                      <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                        #{tag}
                                      </span>
                                    ))}
                                    {todo.dueDate && (
                                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full" title="Due date">
                                        📅 {new Date(todo.dueDate).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {todo.context && (
                                  <div className="mt-1 text-xs text-gray-500 italic" title="Original context">
                                    "{todo.context}"
                                  </div>
                                )}
                              </div>
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
                        </div>
                      ))}
                    </div>
                  );
                });
              })()
            )}
          </div>

          {/* Clear completed button */}
          {completedCount > 0 && (
            <div className="text-center">
              <button onClick={clearCompleted} className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                Clear completed ({completedCount})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
