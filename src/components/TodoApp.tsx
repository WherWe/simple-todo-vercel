"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";

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

interface Draft {
  id: string; // client-generated id
  text: string;
  status: "queued" | "processing" | "error";
  error?: string;
  createdAt: string; // ISO
}

interface QueryResult {
  isQuery: boolean;
  intent: string;
  keywords: string[];
  response: string;
  matchingTodoIds: number[];
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

  // Draft buffer for FIFO AI processing
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isProcessingDraft, setIsProcessingDraft] = useState(false);
  const aiActive = isProcessingDraft || drafts.some((d) => d.status === "queued" || d.status === "processing");

  // Query state for intelligent filtering
  const [activeQuery, setActiveQuery] = useState<QueryResult | null>(null);
  const [filteredTodoIds, setFilteredTodoIds] = useState<Set<number>>(new Set());
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryClearTimer, setQueryClearTimer] = useState<NodeJS.Timeout | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [dateFilter, setDateFilter] = useState<Set<string>>(new Set()); // "overdue", "today", "this-week"

  // Load todos from API on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  // Auto-process drafts when they're added to the queue
  useEffect(() => {
    const hasQueuedDrafts = drafts.some((d) => d.status === "queued");

    if (!isProcessingDraft && hasQueuedDrafts) {
      // Use a small delay to ensure state has settled
      const timer = setTimeout(() => {
        processNextDraft();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [drafts.length, isProcessingDraft]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // / to focus search (unless in input)
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
      }

      // Esc to clear filters (if any are active)
      if (e.key === "Escape" && hasActiveFilters()) {
        clearAllFilters();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery, priorityFilter, tagFilter, statusFilter, dateFilter]);

  // Cleanup query timer on unmount
  useEffect(() => {
    return () => {
      if (queryClearTimer) {
        clearTimeout(queryClearTimer);
      }
    };
  }, [queryClearTimer]);

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

  // Extract all unique tags from todos
  const getAllTags = (): string[] => {
    const tagSet = new Set<string>();
    todos.forEach((todo) => {
      todo.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  // Apply all active filters to todos
  const getFilteredTodos = (): Todo[] => {
    let filtered = [...todos];

    // AI Query filter (takes priority when active)
    if (activeQuery && filteredTodoIds.size > 0) {
      filtered = filtered.filter((todo) => filteredTodoIds.has(todo.id));
    }

    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((todo) => todo.text.toLowerCase().includes(query) || todo.tags?.some((tag) => tag.toLowerCase().includes(query)) || todo.context?.toLowerCase().includes(query));
    }

    // Priority filter
    if (priorityFilter.size > 0) {
      filtered = filtered.filter((todo) => priorityFilter.has(todo.priority));
    }

    // Tag filter
    if (tagFilter.size > 0) {
      filtered = filtered.filter((todo) => todo.tags?.some((tag) => tagFilter.has(tag)));
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((todo) => !todo.completed);
    } else if (statusFilter === "completed") {
      filtered = filtered.filter((todo) => todo.completed);
    }

    // Date filter
    if (dateFilter.size > 0) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      filtered = filtered.filter((todo) => {
        if (!todo.dueDate && dateFilter.has("no-date")) return true;
        if (!todo.dueDate) return false;

        const dueDate = new Date(todo.dueDate);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        if (dateFilter.has("overdue") && dueDateOnly < today) return true;
        if (dateFilter.has("today") && dueDateOnly.getTime() === today.getTime()) return true;
        if (dateFilter.has("this-week") && dueDateOnly >= today && dueDateOnly < weekFromNow) return true;

        return false;
      });
    }

    return filtered;
  };

  // Check if any filters are active
  const hasActiveFilters = (): boolean => {
    return (activeQuery && filteredTodoIds.size > 0) || searchQuery.trim() !== "" || priorityFilter.size > 0 || tagFilter.size > 0 || statusFilter !== "all" || dateFilter.size > 0;
  };

  // Clear all filters
  const clearAllFilters = () => {
    if (queryClearTimer) {
      clearTimeout(queryClearTimer);
      setQueryClearTimer(null);
    }
    setActiveQuery(null);
    setFilteredTodoIds(new Set());
    setSearchQuery("");
    setPriorityFilter(new Set());
    setTagFilter(new Set());
    setStatusFilter("all");
    setDateFilter(new Set());
  };

  // Highlight search term in text
  const highlightSearchTerm = (text: string): React.ReactNode => {
    if (!searchQuery.trim()) return text;

    const query = searchQuery.trim();
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Parse summary text with markdown-style formatting
  const parseSummaryText = (text: string): React.ReactNode => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      // Parse **bold** text
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={j} className="font-semibold text-purple-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={j}>{part}</span>;
      });
      return (
        <div key={i} className="mb-2 last:mb-0">
          {formattedLine}
        </div>
      );
    });
  };

  // Generate smart summary
  const getSummary = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const activeTodos = todos.filter((t) => !t.completed);
    const overdue = activeTodos.filter((t) => t.dueDate && new Date(t.dueDate) < today);
    const todayTodos = activeTodos.filter((t) => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      return dueDateOnly.getTime() === today.getTime();
    });
    const tomorrowTodos = activeTodos.filter((t) => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      return dueDateOnly.getTime() === tomorrow.getTime();
    });
    const thisWeekTodos = activeTodos.filter((t) => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      return dueDateOnly >= today && dueDateOnly < weekFromNow;
    });
    const highPriority = activeTodos.filter((t) => t.priority === "high");

    // Generate conversational summary
    let summary = "";

    if (activeTodos.length === 0) {
      return "🎉 You're all caught up! No active todos right now. Time to relax or add something new.";
    }

    // Overdue warning
    if (overdue.length > 0) {
      const overdueItems = overdue
        .slice(0, 2)
        .map((t) => t.text)
        .join(", ");
      summary += `⚠️ **${overdue.length} overdue item${overdue.length > 1 ? "s" : ""}**: ${overdueItems}${overdue.length > 2 ? "..." : ""}.\n\n`;
    }

    // Today's focus
    if (todayTodos.length > 0) {
      const todayItems = todayTodos
        .slice(0, 3)
        .map((t) => `• ${t.text}`)
        .join("\n");
      summary += `📅 **Today** (${todayTodos.length} task${todayTodos.length > 1 ? "s" : ""}):\n${todayItems}${todayTodos.length > 3 ? "\n• ..." : ""}\n\n`;
    } else {
      summary += `📅 **Today**: Nothing scheduled! You're free to focus on other things.\n\n`;
    }

    // Tomorrow preview
    if (tomorrowTodos.length > 0) {
      const tomorrowItems = tomorrowTodos
        .slice(0, 2)
        .map((t) => t.text)
        .join(", ");
      summary += `🗓️ **Tomorrow**: ${tomorrowItems}${tomorrowTodos.length > 2 ? ` +${tomorrowTodos.length - 2} more` : ""}.\n\n`;
    }

    // This week overview
    if (thisWeekTodos.length > todayTodos.length + tomorrowTodos.length) {
      const remaining = thisWeekTodos.length - todayTodos.length - tomorrowTodos.length;
      summary += `📆 **This week**: ${remaining} more task${remaining > 1 ? "s" : ""} coming up.\n\n`;
    }

    // High priority callout
    if (highPriority.length > 0) {
      const urgentItems = highPriority
        .slice(0, 2)
        .map((t) => t.text)
        .join(", ");
      summary += `🔥 **Urgent**: ${urgentItems}${highPriority.length > 2 ? ` +${highPriority.length - 2} more` : ""}.`;
    }

    return summary.trim();
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

  // Handle query execution
  const executeQuery = async (queryResult: QueryResult) => {
    console.log("Executing query:", queryResult);

    // Clear any existing auto-clear timer
    if (queryClearTimer) {
      clearTimeout(queryClearTimer);
    }

    setActiveQuery(queryResult);
    setFilteredTodoIds(new Set(queryResult.matchingTodoIds));

    // Auto-clear query after 10 seconds
    const timer = setTimeout(() => {
      setActiveQuery(null);
      setFilteredTodoIds(new Set());
      setQueryClearTimer(null);
    }, 10000);

    setQueryClearTimer(timer);
  };

  // Smart input handler: detects query vs todo creation
  const enqueueDraftFromInput = async () => {
    const text = inputText.trim();
    if (!text) return;

    // Clear input immediately for better UX
    setInputText("");
    setIsQuerying(true);

    try {
      // Step 1: Ask AI if this is a query or todo creation
      const queryResponse = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, todos }),
      });

      if (!queryResponse.ok) {
        throw new Error("Query detection failed");
      }

      const queryResult: QueryResult = await queryResponse.json();
      console.log("Query detection result:", queryResult);

      // Step 2: Route to query or todo creation flow
      if (queryResult.isQuery) {
        // This is a question - execute query
        await executeQuery(queryResult);
      } else {
        // This is todo creation - queue for AI extraction
        const draft: Draft = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text,
          status: "queued",
          createdAt: new Date().toISOString(),
        };
        console.log("Draft queued:", text);
        setDrafts((prev) => [draft, ...prev]);
      }
    } catch (err) {
      console.error("Input processing error:", err);
      setError("Failed to process input");
      // Restore input on error
      setInputText(text);
    } finally {
      setIsQuerying(false);
    }
  };

  // Process next draft in FIFO order
  const processNextDraft = async (): Promise<void> => {
    // Prevent parallel processing
    if (isProcessingDraft) return;

    const next = getNextDraft();
    if (!next) return;

    console.log("Processing draft:", next.text);
    setIsProcessingDraft(true);

    // Mark as processing
    setDrafts((prev) => prev.map((d) => (d.id === next.id ? { ...d, status: "processing" as const, error: undefined } : d)));

    try {
      // Call AI to extract todos from this draft
      const response = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: next.text }),
      });

      if (!response.ok) throw new Error("Failed to extract todos");
      const result = await response.json();

      if (!result || !Array.isArray(result.todos)) throw new Error("AI returned invalid response");

      // Save extracted todos
      const savedTodos: Todo[] = [];
      for (const extractedTodo of result.todos) {
        if (!extractedTodo || typeof extractedTodo.text !== "string") continue;

        const todoResponse = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: extractedTodo.text,
            tags: extractedTodo.tags,
            priority: extractedTodo.priority,
            dueDate: extractedTodo.dueDate,
            context: extractedTodo.context ?? next.text,
            aiGenerated: true,
          }),
        });

        if (todoResponse.ok) {
          const savedTodo = await todoResponse.json();
          savedTodos.push({
            ...savedTodo,
            id: typeof savedTodo.id === "string" ? Number(savedTodo.id) : savedTodo.id,
          });
        }
      }

      console.log(`AI extracted ${savedTodos.length} todo(s)`);

      // Add with staggered animation
      for (let i = 0; i < savedTodos.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const todo = savedTodos[i];
        setNewTodoIds((prev) => new Set([...prev, todo.id]));
        setTodos((prev) => [todo, ...prev]);
      }

      // Clear animation marks later
      setTimeout(() => setNewTodoIds(new Set()), 1000);

      // Remove the processed draft from queue (FIFO)
      setDrafts((prev) => prev.filter((d) => d.id !== next.id));
    } catch (err: any) {
      console.error("Draft processing error:", err.message);
      setDrafts((prev) => prev.map((d) => (d.id === next.id ? { ...d, status: "error" as const, error: err?.message || "Failed" } : d)));
    } finally {
      setIsProcessingDraft(false);
    }
  };
  const getNextDraft = (): Draft | undefined => {
    // FIFO: pick the last in array (since we unshift at front), or reverse of our push strategy
    // We added new drafts at the front, so the FIFO element is the last one
    const queued = drafts.filter((d) => d.status === "queued");
    const next = queued.slice(-1)[0];
    console.log("[GET_NEXT] All drafts:", drafts);
    console.log("[GET_NEXT] Queued drafts:", queued);
    console.log("[GET_NEXT] Selected next draft:", next);
    return next;
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

  // Optimistic delete: remove from UI immediately, rollback on error
  const deleteTodo = async (id: number) => {
    // 1. Find the todo before removing it (for potential rollback)
    const todoToDelete = todos.find((t) => t.id === id);
    if (!todoToDelete) return;

    // 2. Optimistically remove from UI immediately
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
    console.log("Todo deleted from UI:", id);

    // 3. Queue the actual deletion in background
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete todo");
      }

      console.log("Todo deleted from database:", id);
    } catch (err) {
      // 4. ROLLBACK: Re-insert the todo if deletion failed
      console.error("Delete failed, rolling back:", err);
      setTodos((prev) => [todoToDelete, ...prev]);
      setError(`Failed to delete "${todoToDelete.text}". It has been restored.`);

      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
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
        enqueueDraftFromInput();
      }
    }
  };

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
      {/* Header with User Profile */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">AI Todo Assistant</h1>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-10 h-10",
            },
          }}
        />
      </div>

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
              aiActive ? "scale-[1.02] ring-4 ring-purple-400 ring-opacity-40 shadow-2xl shadow-purple-200" : "shadow-lg hover:shadow-xl"
            } rounded-2xl bg-gradient-to-br from-white to-gray-50 p-6`}
          >
            <div className="space-y-4">
              {/* Large Textarea Input */}
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isExtracting ? "✨ AI is working its magic..." : "What's on your mind? Add a single todo or ramble about everything you need to do..."}
                disabled={loading}
                rows={3}
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 text-black bg-white text-base resize-none transition-all duration-300 hover:border-gray-300`}
                style={{ minHeight: "90px" }}
              />

              {/* AI Extracting Indicator */}
              {aiActive && (
                <div className="flex items-center gap-3 text-purple-600 animate-pulse bg-purple-50 px-4 py-3 rounded-lg">
                  <div className="relative">
                    <span className="text-2xl animate-bounce">🤖</span>
                    <span className="absolute inset-0 text-2xl animate-ping opacity-30">✨</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">AI is processing drafts...</p>
                    <p className="text-xs text-purple-500">Extracting todos, assigning tags, priorities, and dates</p>
                  </div>
                </div>
              )}

              {/* Button Row */}
              <div className="flex gap-2">
                <button
                  onClick={addTodo}
                  disabled={loading || !inputText.trim()}
                  className="flex-1 px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 font-medium rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 shadow-sm hover:shadow-md transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? "Adding..." : "Add Simple Todo"}
                </button>
                <button
                  onClick={enqueueDraftFromInput}
                  disabled={loading || !inputText.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  {aiActive ? (
                    <>
                      <span className="animate-spin text-lg">✨</span>
                      <span>Queued</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">✨</span>
                      <span>Add to Drafts</span>
                    </>
                  )}
                </button>
              </div>

              {/* Helper Text */}
              {!aiActive && (
                <p className="text-sm text-gray-600 text-center leading-relaxed space-x-1">
                  <span className="inline-flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-xs font-mono shadow-sm">Enter</kbd>
                    <span className="text-gray-500">add to drafts (AI)</span>
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

            {/* Smart Summary Panel */}
            {todos.length > 0 &&
              !aiActive &&
              (() => {
                const summary = getSummary();
                return (
                  <div className="mt-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4 shadow-md">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">�</span>
                      <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wide">What's Ahead</h3>
                    </div>

                    <div className="text-sm text-gray-800 leading-relaxed">{parseSummaryText(summary)}</div>
                  </div>
                );
              })()}
          </div>
        </div>

        {/* RIGHT COLUMN - Todo List Section */}
        <div className="space-y-4">
          {/* AI Query Response Bubble */}
          {activeQuery && (
            <div className="animate-slide-down bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🤖</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-blue-900 mb-1">AI Response ({activeQuery.intent.replace(/_/g, " ")})</div>
                  <div className="text-gray-800 leading-relaxed">{activeQuery.response}</div>
                  {activeQuery.keywords.length > 0 && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {activeQuery.keywords.map((kw, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (queryClearTimer) {
                        clearTimeout(queryClearTimer);
                        setQueryClearTimer(null);
                      }
                      setActiveQuery(null);
                      setFilteredTodoIds(new Set());
                    }}
                    className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear filter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter Bar */}
          <div className="bg-white border border-gray-300 rounded-lg p-4 space-y-3 shadow-sm">
            {/* Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search todos... (press / to focus)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                )}
              </div>
              {hasActiveFilters() && (
                <button onClick={clearAllFilters} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded-lg transition-colors whitespace-nowrap">
                  Clear All
                </button>
              )}
            </div>

            {/* Quick Filter Chips */}
            <div className="space-y-2">
              {/* Priority Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-600 uppercase">Priority:</span>
                {["high", "medium", "low"].map((priority) => (
                  <button
                    key={priority}
                    onClick={() => {
                      const newSet = new Set(priorityFilter);
                      if (newSet.has(priority)) {
                        newSet.delete(priority);
                      } else {
                        newSet.add(priority);
                      }
                      setPriorityFilter(newSet);
                    }}
                    className={`px-2 py-1 text-xs rounded-full transition-all ${
                      priorityFilter.has(priority)
                        ? priority === "high"
                          ? "bg-red-500 text-white"
                          : priority === "medium"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tag Filters */}
              {getAllTags().length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-600 uppercase">Tags:</span>
                  {getAllTags().map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        const newSet = new Set(tagFilter);
                        if (newSet.has(tag)) {
                          newSet.delete(tag);
                        } else {
                          newSet.add(tag);
                        }
                        setTagFilter(newSet);
                      }}
                      className={`px-2 py-1 text-xs rounded-full transition-all ${tagFilter.has(tag) ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Status and Date Filters */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase">Status:</span>
                  {(["all", "active", "completed"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-2 py-1 text-xs rounded-full transition-all ${statusFilter === status ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Date */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase">Date:</span>
                  {[
                    { key: "overdue", label: "Overdue" },
                    { key: "today", label: "Today" },
                    { key: "this-week", label: "This Week" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => {
                        const newSet = new Set(dateFilter);
                        if (newSet.has(key)) {
                          newSet.delete(key);
                        } else {
                          newSet.add(key);
                        }
                        setDateFilter(newSet);
                      }}
                      className={`px-2 py-1 text-xs rounded-full transition-all ${dateFilter.has(key) ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters() && (
              <div className="pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  Showing {getFilteredTodos().length} of {todos.length} todos
                </div>
              </div>
            )}
          </div>

          {/* Drafts Section */}
          {drafts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-purple-600">
                  Drafts
                  <span className="ml-2 text-xs font-normal text-gray-500">({drafts.length})</span>
                </h3>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              {drafts
                .slice() // render newest first
                .map((d) => (
                  <div key={d.id} className={`border rounded-lg ${d.status === "processing" ? "border-purple-300 bg-purple-50 animate-pulse" : "bg-white border-gray-300"} p-3`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {d.status === "processing" ? (
                          <span className="inline-block h-4 w-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></span>
                        ) : d.status === "queued" ? (
                          <span className="inline-block h-4 w-4 rounded-full bg-gray-300"></span>
                        ) : (
                          <span className="inline-block h-4 w-4 rounded-full bg-red-300"></span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-gray-800">{d.text}</div>
                        <div className="mt-1 text-xs">
                          {d.status === "processing" && <span className="text-purple-600">Processing with AI…</span>}
                          {d.status === "queued" && <span className="text-gray-500">Queued</span>}
                          {d.status === "error" && <span className="text-red-600">{d.error || "Failed"}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

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
            ) : hasActiveFilters() && getFilteredTodos().length === 0 ? (
              <p className="text-gray-500 text-center py-8">No todos match your filters. Try adjusting them.</p>
            ) : (
              (() => {
                const todosToDisplay = hasActiveFilters() ? getFilteredTodos() : todos;
                const groupedTodos = groupTodosByDate(todosToDisplay);
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
                      {groupTodos.map((todo) => {
                        // Highlight if this is from an active AI query
                        const shouldHighlight = activeQuery && filteredTodoIds.has(todo.id);

                        return (
                          <div
                            key={todo.id}
                            className={`border rounded-lg transition-all ${newTodoIds.has(todo.id) ? "todo-appear" : ""} ${shouldHighlight ? "ring-2 ring-blue-400 shadow-lg" : ""} ${
                              todo.completed ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300"
                            } ${todo.aiGenerated ? "border-l-4 border-l-purple-400 shadow-md" : ""}`}
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
                                      {highlightSearchTerm(todo.text)}
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
                        );
                      })}
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
