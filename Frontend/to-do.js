const taskList = document.getElementById("to-doList");
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");

// 1. Render task HTML helper
function createListItemElement(todo) {
  const wrapper = document.createElement('div');
  wrapper.className = 'list-item';
  wrapper.dataset.id = todo.id;
  wrapper.innerHTML = `
    <li class="task">${todo.title}</li>
    <button class="edit">
      <span class="material-symbols-outlined editIcon">edit</span>
    </button>
    <button class="delete">
      <span class="material-symbols-outlined deleteIcon">delete</span>
    </button>
  `;
  return wrapper;
}

// 2. Get all todos
async function getTodos() {
  const response = await fetch(`http://localhost:8000/todos`);
  const todos = await response.json();
  taskList.innerHTML = "";
  todos.forEach(todo => {
    taskList.appendChild(createListItemElement(todo));
  });
}

// 3. Create task
async function createTask(title) {
  const response = await fetch("http://localhost:8000/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title })
  });
  const newTodo = await response.json();
  taskList.prepend(createListItemElement(newTodo));
}

// 4. Update task (API call)
async function updateTask(id, newTitle, wrapperElement) {
  try {
    const response = await fetch(`http://localhost:8000/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle })
    });

    if (response.ok) {
      const updatedTodo = await response.json();
      // Restore default list item HTML with updated title
      wrapperElement.innerHTML = `
        <li class="task">${updatedTodo.title}</li>
        <button class="edit">
          <span class="material-symbols-outlined editIcon">edit</span>
        </button>
        <button class="delete">
          <span class="material-symbols-outlined deleteIcon">delete</span>
        </button>
      `;
    } else {
      console.error("Failed to update task");
    }
  } catch (error) {
    console.error("Error updating task:", error);
  }
}

// 5. Delete task
async function deleteTask(id, wrapperElement) {
  try {
    const response = await fetch(`http://localhost:8000/todos/${id}`, {
      method: "DELETE"
    });
    if (response.ok) {
      wrapperElement.remove();
    } else {
      console.error("Failed to delete task from DB");
    }
  } catch (error) {
    console.error("Error deleting task:", error);
  }
}

// Event Listeners
addBtn.addEventListener("click", async () => {
  const taskTitle = taskInput.value.trim();
  if (taskTitle !== "") {
    await createTask(taskTitle);
    taskInput.value = "";
  }
});

// Single event listener on list for Delete, Edit, Save, and Cancel actions
taskList.addEventListener("click", (e) => {
  const wrapper = e.target.closest(".list-item");
  if (!wrapper) return;
  const taskId = wrapper.dataset.id;

  // Handle Delete
  const deleteBtn = e.target.closest(".delete");
  if (deleteBtn && taskId) {
    deleteTask(taskId, wrapper);
    return;
  }

  // Handle Edit button click (switches UI to input field)
  const editBtn = e.target.closest(".edit");
  if (editBtn) {
    const taskElement = wrapper.querySelector(".task");
    const currentTitle = taskElement.textContent;

    wrapper.innerHTML = `
      <input type="text" class="edit-input" value="${currentTitle}" />
      <button class="save">
        <span class="material-symbols-outlined">check</span>
      </button>
      <button class="cancel">
        <span class="material-symbols-outlined">close</span>
      </button>
    `;
    return;
  }

  // Handle Save button click
  const saveBtn = e.target.closest(".save");
  if (saveBtn && taskId) {
    const input = wrapper.querySelector(".edit-input");
    const updatedTitle = input.value.trim();
    if (updatedTitle !== "") {
      updateTask(taskId, updatedTitle, wrapper);
    }
    return;
  }

  // Handle Cancel button click
  const cancelBtn = e.target.closest(".cancel");
  if (cancelBtn) {
    getTodos(); // Reload list to reset view
  }
});

getTodos();