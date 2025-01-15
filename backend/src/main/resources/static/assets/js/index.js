document.getElementById('logoutButton').addEventListener('click', async function () {
    try {
        const response = await fetch('/logout', {
            method: 'GET',
        });

        if (response.redirected) {
            // Redirige al usuario a la página de login
            window.location.href = "/";
        } else {
            console.error('Error al cerrar sesión');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    const addTaskBtn = document.getElementById("add-task-btn");
    const taskModal = document.getElementById("task-tmodal");
    const closetModal = document.getElementById("close-tmodal");
    const taskForm = document.getElementById("task-form");
    const taskList = document.getElementById("task-list");
    const taskCreatedInput = document.getElementById("task-created");
    const taskDeadlineInput = document.getElementById("task-deadline");
    const formHeader = document.querySelector("#task-tmodal h4");


    const editProfileBtn = document.getElementById("username-display");
    const editProfileModal = document.getElementById('settings-modal');
    const closeProfileModal = document.getElementById("close-settings-modal");
    const profileForm = document.getElementById("settings-form")




    let editMode = false;
    let currentTask = null;

    // Cargar las tareas al iniciar la página
    let profileData = await loadTasks();
    let UserId = profileData._id;
    document.getElementById("username-display").textContent = profileData.username;
    /*let UserFullName = profileData.fullName;
    let UserEmail = profileData.email;
    let UserName = profileData.username;
    let UserPassword = profileData.password;*/
    console.log("userId recibido de Mainkt: ", UserId)

    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    taskCreatedInput.value = formattedDate;
    taskCreatedInput.disabled = true;
    taskDeadlineInput.setAttribute("min", formattedDate);

    addTaskBtn.addEventListener("click", () => {
        formHeader.textContent = "Agregar Tarea";
        taskModal.classList.remove("hidden");
        taskForm.reset();
        taskCreatedInput.value = formattedDate;
        taskDeadlineInput.setAttribute("min", formattedDate);
        editMode = false;
        currentTask = null;
    });

    closetModal.addEventListener("click", () => {
        taskModal.classList.add("hidden");
    });

    taskForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const taskData = {
            userId: UserId,
            title: document.getElementById("task-name").value,
            description: document.getElementById("task-desc").value,
            priority: document.getElementById("task-priority").value,
            createdAt: taskCreatedInput.value,
            dueDate: taskDeadlineInput.value,
            status: "Pendiente", // Establece un estado predeterminado
        };

        if (editMode && currentTask) {
            updateTask(currentTask, taskData);
        } else {
            addTask(taskData);
        }

        taskModal.classList.add("hidden");
    });

    editProfileBtn.addEventListener("click", () => {
        loadProfileIntoForm(profileData)
        editProfileModal.classList.remove('hidden');
    });

    closeProfileModal.addEventListener("click", () => {
        editProfileModal.classList.add('hidden');
    });

    profileForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const userData = {
            fullName: document.getElementById('user-name').value,
            email: document.getElementById('user-email').value,
            username: document.getElementById('user-username').value,
            password: document.getElementById('user-password').value,
        };

        updateUser(userData)
        taskModal.classList.add("hidden");
    });

    async function updateUser(userData){
        try {
            const response = await fetch('/update-user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData),
            });

            if (response.ok) {
                M.toast({ html: '⚙️ Datos actualizados', classes: 'green darken-1' });
                document.getElementById('settings-modal').classList.add('hidden');
            } else {
                throw new Error(`Error al editar la tarea: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error inesperado.');
        }
    }




    async function loadTasks() {
        try {
            const profileResponse = await fetch('/profileData');
            if (profileResponse.status === 401) {
                console.warn('Usuario no autorizado. Redirigiendo al login...');
                window.location.href = '/'; // Redirige al login
                return; // Termina la ejecución
            }
            if (!profileResponse.ok) {
                throw new Error(`Error inesperado en /profileData: ${profileResponse.status}`);
            }

            const profileData = await profileResponse.json();
            console.log("User data: ", profileData)
            console.log('User ID:', profileData._id);

            const tasksResponse = await fetch('/tasks');
            if (!tasksResponse.ok) {
                throw new Error(`Error inesperado en /tasks: ${tasksResponse.status}`);
            }

            const tasksData = await tasksResponse.json();
            console.log('Tasks:', tasksData);

            renderTasks(tasksData);
            return profileData;
        } catch (error) {
            console.error('Error al cargar los datos del usuario:', error);
        }
    }

    function renderTasks(tasks) {
        taskList.innerHTML = ''; // Limpia la lista antes de renderizar
        tasks.forEach(task => {
            const taskItem = createTaskElement(task);
            taskList.appendChild(taskItem);
        });
        sortTasks();
    }

    function createTaskElement(task) {
        const taskItem = document.createElement("li");
        taskItem.classList.add("task-item");

        const priorityClass = getPriorityClass(task.priority);
        taskItem.setAttribute("data-id", task._id);

        taskItem.innerHTML = `
            <div>
                <strong>${task.title}</strong> - <span class="priority-tag ${priorityClass}">${capitalize(task.priority)}</span>
                <p>${task.description}</p>
                <small>Creada: ${task.createdAt.split("T")[0]} | Límite: ${task.dueDate.split("T")[0]}</small>
            </div>
            <div>
                <button class="edit-btn">Editar</button>
                <button class="delete-btn">Eliminar</button>     
            </div>
        `;

        // Agregar eventos para editar y eliminar tareas
        taskItem.querySelector(".edit-btn").addEventListener("click", () => {
            formHeader.textContent = "Editar Tarea";
            editMode = true;
            currentTask = taskItem;
            loadTaskIntoForm(task);
            taskModal.classList.remove("hidden");
        });

        taskItem.querySelector(".delete-btn").addEventListener("click", async () => {
            await deleteTask(task._id);
            taskList.removeChild(taskItem);
        });

        return taskItem;
    }

    async function addTask(task) {
        console.log("Datos antes de ser enviados a /tasks: ", task); // Verifica el objeto task en consola
        try {
            // Enviar datos a la ruta /tasks usando fetch
            const response = await fetch('/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // Indica que se envía JSON
                },
                body: JSON.stringify(task) // Convierte el objeto a JSON
            });

            if (!response.ok) {
                throw new Error(`Error al enviar la tarea: ${response.statusText}`);
            }

            M.toast({ html: '➕ Tarea creada', classes: 'green darken-1' });
            const data = await response.json(); // Espera la respuesta en formato JSON
            console.log('Respuesta del servidor:', data);

            task._id = data._id

            console.log("Id del task generado desde Mainkt: ", task)

            // Lógica para actualizar la UI
            const taskItem = createTaskElement(task);
            taskList.appendChild(taskItem);
            sortTasks(); // Ordena las tareas (si es necesario)
        } catch (error) {
            console.error('Error:', error.message); // Captura cualquier error
        }
    }

    async function updateTask(taskItem, taskData) {
        const taskId = taskItem.getAttribute("data-id");
        console.log("Task a editar: ", taskId) // Verificar objeto en consola
        try {
            // Enviar datos a la ruta /tasks usando fetch
            const response = await fetch(`/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json' // Indica que se envía JSON
                },
                body: JSON.stringify(taskData) // Convierte el objeto a JSON
            });

            if (!response.ok) {
                throw new Error(`Error al editar la tarea: ${response.statusText}`);
            }

            //const data = await response.json(); // Espera la respuesta en formato JSON

            console.log("Tarea actualizada con exito")
            M.toast({ html: '📝 Tarea actualizada', classes: 'green darken-1' });

            // Lógica para actualizar la UI
            taskData._id = taskId
            const updatedTaskItem = createTaskElement(taskData);
            taskList.replaceChild(updatedTaskItem, taskItem);
            sortTasks(); // Ordena las tareas (si es necesario)
        } catch (error) {
            console.error('Error:', error.message); // Captura cualquier error
        }
    }



    async function deleteTask(taskId) {
        console.log("Tarea a eliminar: ", taskId)
        try {
            const response = await fetch(`/tasks/${taskId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                console.error("Error al eliminar la tarea");
            }

            M.toast({ html: '🗑️ Tarea eliminada', classes: 'green darken-1' });
        } catch (error) {
            console.error("Error al eliminar la tarea:", error);
        }
    }

    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function loadTaskIntoForm(task) {
        //M.textareaAutoResize($('#task-name'));
        console.log("Editando tarea: ", task)

        document.getElementById("task-name").value = task.title;
        document.getElementById("task-desc").value = task.description;
        document.getElementById("task-priority").value = task.priority;
        taskCreatedInput.value = task.createdAt;
        taskDeadlineInput.value = task.dueDate;
        taskDeadlineInput.setAttribute("min", task.createdAt);

        M.updateTextFields();
    }


    function loadProfileIntoForm(dataUsr) {
        //M.textareaAutoResize($('#task-name'));
        console.log("Editando tarea: ", dataUsr)

        document.getElementById("user-name").value = dataUsr.fullName;
        document.getElementById("user-email").value = dataUsr.email;
        document.getElementById("user-username").value = dataUsr.username;
        document.getElementById("user-password").value = dataUsr.password;

        M.updateTextFields();
    }


    function sortTasks() {
        const tasks = Array.from(taskList.children);

        tasks.sort((a, b) => {
            const deadlineA = parseInt(a.dataset.deadline, 10);
            const deadlineB = parseInt(b.dataset.deadline, 10);
            const priorityA = getPriorityValue(a.dataset.priority);
            const priorityB = getPriorityValue(b.dataset.priority);

            if (deadlineA !== deadlineB) {
                return deadlineA - deadlineB; // Sort by date (earliest first)
            }
            return priorityB - priorityA; // Sort by priority (highest first)
        });

        taskList.innerHTML = "";
        tasks.forEach((task) => taskList.appendChild(task));
    }

    function getPriorityValue(priority) {
        switch (priority) {
            case "Alta":
                return 3;
            case "Media":
                return 2;
            case "Baja":
                return 1;
            default:
                return 0;
        }
    }


    function getPriorityClass(priority) {
        switch (priority) {
            case "Baja":
                return "priority-baja";
            case "Media":
                return "priority-media";
            case "Alta":
                return "priority-alta";
            default:
                return "";
        }
    }
});

// JavaScript para alternar entre mostrar y ocultar la contraseña
document.querySelector('.toggle-password').addEventListener('click', function() {
    const passwordField = document.getElementById('user-password');
    const type = passwordField.type === 'password' ? 'text' : 'password';
    passwordField.type = type;
    // Cambiar el ícono
    this.textContent = type === 'password' ? 'visibility' : 'visibility_off';
});