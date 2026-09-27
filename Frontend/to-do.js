const taskList = document.getElementById("to-doList")
async function getTodos() {
    const response = await fetch(`http://localhost:8000/todos`)
    const todos = await response.json()
    taskList.innerHTML = "";
    todos.forEach(todo => {
        const wrapper = document.createElement('div');
        wrapper.className = 'list-item';
        wrapper.innerHTML=`
            <li class="task">${todo.title}</li>
            <button class="delete" id="delete">
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
        const todo = await response.json();
        console(todo);
    }
getTodos()