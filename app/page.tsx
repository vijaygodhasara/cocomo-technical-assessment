"use client"
import { Todo } from '@prisma/client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingIds, setLoadingIds] = useState<number[]>([]); // Track loading states

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    setIsLoading(true); // Set loading to true
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodo, dueDate }),
      });
      const newTodoItem = await response.json();

      // Add the new todo item to the existing list
      setTodos((prevTodos) => [ newTodoItem, ...prevTodos]);
      setNewTodo('');
      setDueDate('');

      // Generate image after the todo is added
      await generateImage(newTodoItem.id, newTodoItem.title);

    } catch (error) {
      console.error('Failed to add todo:', error);
    } finally {
      setIsLoading(false); // Set loading to false
    }
  };

  const generateImage = async (todoId: number, title: string) => {
    setLoadingIds((prev) => [...prev, todoId]); // Add the todo ID to loading state
    try {
      const res = await fetch('/api/todos/generateImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId, title }),
      });
      const { imageUrl } = await res.json();
      
      // Update the todo with the generated image URL
      setTodos((prev) =>
        prev.map((todo) => (todo.id === todoId ? { ...todo, imageUrl } : todo))
      );
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== todoId)); // Remove loading ID
    }
  };

  const handleDeleteTodo = async (id:any) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      fetchTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="min-h-screen flex justify-center bg-gradient-to-b from-orange-400 to-red-500 p-6">
      <div className="w-full max-w-2xl rounded-lg p-8 space-y-8">
        {/* App Title */}
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-6">
          Things To Do App
        </h1>

        {/* Form Section */}
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-6">
          <input
            type="text"
            className="flex-grow p-4 mb-4 md:mb-0 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md border border-gray-300"
            placeholder="Add a new task"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <input
            type="date"
            className="p-4 mb-4 md:mb-0 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <button
            onClick={handleAddTodo}
            className="py-4 px-6 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition duration-300 shadow-md"
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Task'}
          </button>
        </div>

        {/* Task List Section */}
        <div className="overflow-y-auto border-gray-200 rounded-lg p-4 ">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
            Your Tasks
          </h2>
          <ul className="space-y-4">
            {todos.length === 0 ? (
              <li className="text-gray-500 text-center">No tasks available. Add a task!</li>
            ) : (
              todos.map((todo) => (
                <li
                  key={todo.id}
                  className="relative flex justify-between items-center p-4 rounded-lg shadow-md border border-gray-200 bg-gray-50"
                >
                  <div>
                    <span className="text-lg font-medium text-gray-800">{todo.title}</span>
                    {todo.dueDate && (
                      <span
                        className={`block text-sm mt-1 ${
                          isOverdue(todo.dueDate) ? 'text-red-600' : 'text-gray-500'
                        }`}
                      >
                        Due: {new Date(todo.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {/* Show image if available */}
                    {loadingIds.includes(todo.id) ? ( // Show loading state
                      <div className="mt-2 text-gray-500">Loading image...</div>
                    ) : (
                      todo.imageUrl && ( // Show generated image
                        <img
                          src={todo.imageUrl}
                          alt="Generated"
                          className="mt-2 rounded-lg"
                        />
                      )
                    )}
                  </div>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition duration-300"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
