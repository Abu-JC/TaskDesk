const taskList = document.getElementById("to-doList");
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
async function getTodos() {
    const response = await fetch(`http://localhost:8000/todos`)
    const todos = await response.json()
    taskList.innerHTML = "";
    todos.forEach(todo => {
        const wrapper = document.createElement('div');
        wrapper.className = 'list-item';
        wrapper.dataset.id = todo.id;
        wrapper.innerHTML=`
            <li class="task">${todo.title}</li>
            <button class="delete" >
                <span class="material-symbols-outlined deleteIcon">delete</span>
            </button>
            `
        
        taskList.appendChild(wrapper);
    });
}
async function createTask(title) {
        const response = await fetch("http://localhost:8000/todos",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                title:title
            })
        })
        const newTodo = await response.json();
        const wrapper = document.createElement('div');
    wrapper.className = 'list-item';
    wrapper.dataset.id = newTodo.id;
    wrapper.innerHTML = `
        <li class="task">${newTodo.title}</li>
        <button class="delete">
            <span class="material-symbols-outlined deleteIcon">delete</span>
        </button>
    `;
    taskList.prepend(wrapper);
    }
    addBtn.addEventListener("click",async ()=>{
        const taskTitle=taskInput.value.trim()
        if(taskTitle!==""){
            await createTask(taskTitle)
            taskInput.value= ""
        }     
    })
    async function deleteTask(id,wrapperElement){
        try {
            const response = await fetch(`http://localhost:8000/todos/${id}`,
                {method:"DELETE"}
            );
            if(response.ok){
                wrapperElement.remove();                
                }
                else{
                    console.error("Failed to delete task from DB")
                }
        } catch (error) {
            console.error("Error deleting task:",error);
        }
    }
    taskList.addEventListener("click",(e)=>{
        const deleteBtn = e.target.closest(".delete");
        if(deleteBtn){
            const wrapper = deleteBtn.closest(".list-item");
            const taskId = wrapper.dataset.id;
            if(taskId){
                deleteTask(taskId,wrapper);
            }
        }
    });
        
getTodos()