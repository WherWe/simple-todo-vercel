import TodoApp from "@/components/TodoApp";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl1">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Simple Todo List</h1>
        <TodoApp />
      </div>
    </div>
  );
}
