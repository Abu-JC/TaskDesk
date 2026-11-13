const taskList = document.getElementById("to-doList")
const taskInput = document.getElementById("taskInput")
const descInput = document.getElementById("descInput")
const addBtn = document.getElementById("addBtn")
const filterSelect = document.getElementById("priority")
const sortAscBtn = document.getElementById("sortAscBtn")
const sortDescBtn = document.getElementById("sortDescBtn")

let currentPage = 1
let currentFilter = "all"
let currentOrder = "DESC" // Default to newest first

function createListItemElement(todo, itemNumber) {
  const wrapper = document.createElement('div')
  wrapper.className = `list-item status-${todo.status || 'todo'}`
  wrapper.dataset.id = todo.id

  wrapper.innerHTML = `
    <span class="task-number">${itemNumber}.</span>
    <div class="task-content">
      <span class="task ${todo.status === 'completed' ? 'completed' : ''}">${todo.title}</span>
      ${todo.description ? `<p class="description">${todo.description}</p>` : ''}
    </div>
    <select class="status-select">
      <option value="todo" ${todo.status === 'todo' ? 'selected' : ''}>Todo</option>
      <option value="in_progress" ${todo.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
      <option value="completed" ${todo.status === 'completed' ? 'selected' : ''}>Completed</option>
      <option value="canceled" ${todo.status === 'canceled' ? 'selected' : ''}>Canceled</option>
    </select>
    <button class="edit" title="Edit">
      <span class="material-symbols-outlined editIcon">edit</span>
    </button>
    <button class="delete" title="Delete">
      <span class="material-symbols-outlined deleteIcon">delete</span>
    </button>
  `
  return wrapper
}

// Get all tasks with pagination, filter, and sort order
async function getTodos(page, status = "all", order = "DESC") {
  try {
    let url = `http://localhost:8000/todos?page=${page}&limit=10&order=${order}`
    if (status && status !== "all") {
      url += `&status=${status}`
    }

    const response = await fetch(url)
    const data = await response.json()
    
    currentPage = data.currentPage
    taskList.innerHTML = ""
    
    if (data.tasks.length === 0) {
      taskList.innerHTML = `<p style="padding: 10px; color: #666;">No tasks found.</p>`
    } else {
      data.tasks.forEach((todo, index) => {
        const itemNumber = (currentPage - 1) * 10 + (index + 1)
        taskList.appendChild(createListItemElement(todo, itemNumber))
      })
    }

    renderPaginationControls(data.currentPage, data.totalPages)
  } catch (error) {
    console.error("Error fetching tasks:", error)
  }
}

// Render Pagination Controls UI
function renderPaginationControls(current, total) {
  let container = document.getElementById("pagination-container")
  if (!container) return

  container.innerHTML = `
    <button id="prevBtn" ${current <= 1 ? "disabled" : ""}>Previous</button>
    <span>Page ${current} of ${total}</span>
    <button id="nextBtn" ${current >= total ? "disabled" : ""}>Next</button>
  `

  document.getElementById("prevBtn").addEventListener("click", () => {
    if (currentPage > 1) getTodos(currentPage - 1, currentFilter, currentOrder)
  })

  document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentPage < total) getTodos(currentPage + 1, currentFilter, currentOrder)
  })
}

// Create task
async function createTask(title, description = null) {
  try {
    const response = await fetch("http://localhost:8000/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, status: 'todo' })
    })
    await response.json()
  } catch (error) {
    console.error("Error creating task:", error)
  }
}

// Update task title & description
async function updateTask(id, newTitle, newDescription) {
  try {
    const response = await fetch(`http://localhost:8000/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        title: newTitle, 
        description: newDescription || null 
      })
    })

    if (response.ok) {
      getTodos(currentPage, currentFilter, currentOrder)
    } else {
      console.error("Failed to update task")
    }
  } catch (error) {
    console.error("Error updating task:", error)
  }
}

// Update task status
async function updateTaskStatus(id, status) {
  try {
    await fetch(`http://localhost:8000/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    })
  } catch (error) {
    console.error("Error updating task status:", error)
  }
}

// Delete task
async function deleteTask(id, wrapperElement) {
  try {
    const response = await fetch(`http://localhost:8000/todos/${id}`, {
      method: "DELETE"
    })
    if (response.ok) {
      getTodos(currentPage, currentFilter, currentOrder)
    } else {
      console.error("Failed to delete task from DB")
    }
  } catch (error) {
    console.error("Error deleting task:", error)
  }
}

// Event Listeners
addBtn.addEventListener("click", async () => {
  const taskTitle = taskInput.value.trim()
  const taskDesc = descInput ? descInput.value.trim() : null

  if (taskTitle !== "") {
    await createTask(taskTitle, taskDesc)
    taskInput.value = ""
    if (descInput) descInput.value = ""
    getTodos(1, currentFilter, currentOrder)
  }
})

// Filter dropdown change listener
filterSelect.addEventListener("change", (e) => {
  currentFilter = e.target.value
  getTodos(1, currentFilter, currentOrder)
})

// Sort Button Listeners
sortAscBtn.addEventListener("click", () => {
  currentOrder = "ASC"
  getTodos(1, currentFilter, currentOrder)
})

sortDescBtn.addEventListener("click", () => {
  currentOrder = "DESC"
  getTodos(1, currentFilter, currentOrder)
})

// Delegated click events on taskList
taskList.addEventListener("click", (e) => {
  const wrapper = e.target.closest(".list-item")
  if (!wrapper) return
  const taskId = wrapper.dataset.id

  const deleteBtn = e.target.closest(".delete")
  if (deleteBtn && taskId) {
    deleteTask(taskId, wrapper)
    return
  }

  const editBtn = e.target.closest(".edit")
  if (editBtn) {
    const currentTitle = wrapper.querySelector(".task").textContent
    const descEl = wrapper.querySelector(".description")
    const currentDesc = descEl ? descEl.textContent : ""

    wrapper.innerHTML = `
      <div class="edit-group">
        <input type="text" class="edit-input" value="${currentTitle}" placeholder="Task title..." />
        <input type="text" class="edit-desc-input" value="${currentDesc}" placeholder="Description (optional)..." />
      </div>
      <button class="save" title="Save">
        <span class="material-symbols-outlined">check</span>
      </button>
      <button class="cancel" title="Cancel">
        <span class="material-symbols-outlined">close</span>
      </button>
    `
    return
  }

  const saveBtn = e.target.closest(".save")
  if (saveBtn && taskId) {
    const titleInput = wrapper.querySelector(".edit-input")
    const descInputVal = wrapper.querySelector(".edit-desc-input")
    const updatedTitle = titleInput.value.trim()
    const updatedDesc = descInputVal.value.trim()

    if (updatedTitle !== "") {
      updateTask(taskId, updatedTitle, updatedDesc)
    }
    return
  }

  const cancelBtn = e.target.closest(".cancel")
  if (cancelBtn) {
    getTodos(currentPage, currentFilter, currentOrder)
  }
})

taskList.addEventListener("change", (e) => {
  const selectElement = e.target.closest(".status-select")
  if (!selectElement) return

  const wrapper = selectElement.closest(".list-item")
  if (!wrapper) return

  const taskId = wrapper.dataset.id
  const newStatus = selectElement.value
  const taskSpan = wrapper.querySelector(".task")

  wrapper.className = `list-item status-${newStatus}`
  taskSpan.classList.toggle("completed", newStatus === 'completed')

  updateTaskStatus(taskId, newStatus)
})

// Initial load
getTodos(1, currentFilter, currentOrder)