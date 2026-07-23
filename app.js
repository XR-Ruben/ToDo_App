// Estado de las tareas
let tasks = [];

// Estado actual de los filtros
let currentFilters = {
    status: 'all',
    category: 'all',
    priority: 'all',
    search: '',
    sortBy: 'newest'
};

// Elementos del DOM
const taskForm = document.getElementById('task-form');
const tasksContainer = document.getElementById('tasks-container');
const currentDateEl = document.getElementById('current-date');

// Elementos de estadísticas
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const statPercent = document.getElementById('stat-percent');
const statProgressBar = document.getElementById('stat-progress-bar');

// Elementos de filtro
const statusFilters = document.querySelectorAll('#status-filters button');
const categoryFilter = document.getElementById('filter-category');
const priorityFilter = document.getElementById('filter-priority');
const sortOrder = document.getElementById('sort-order');
const searchInput = document.getElementById('search-input');

// Elementos del modal de edición
const editModal = document.getElementById('edit-modal');
const modalContent = document.getElementById('modal-content');
const editForm = document.getElementById('edit-form');
const closeFormBtn = document.getElementById('close-modal');
const cancelEditBtn = document.getElementById('cancel-edit');
const themeToggle = document.getElementById('theme-toggle');

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadTasks();
    displayCurrentDate();
    setupEventListeners();
    renderTasks();
    initNotifications();
});

// Configurar la visualización de la fecha
function initTheme() {
    const isDarkMode = localStorage.getItem('taskflow_theme') === 'dark' ||
                       (!('taskflow_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDarkMode);
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');
    if (lightIcon && darkIcon) {
        lightIcon.classList.toggle('hidden', isDarkMode);
        darkIcon.classList.toggle('hidden', !isDarkMode);
    }
}

function toggleTheme() {
    const isDarkMode = document.documentElement.classList.toggle('dark');
    localStorage.setItem('taskflow_theme', isDarkMode ? 'dark' : 'light');
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');
    if (lightIcon && darkIcon) {
        lightIcon.classList.toggle('hidden', isDarkMode);
        darkIcon.classList.toggle('hidden', !isDarkMode);
    }
}

function displayCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let dateStr = new Date().toLocaleDateString('es-ES', options);
    currentDateEl.innerHTML = `<i class="fa-regular fa-calendar-days text-indigo-500 dark:text-indigo-400 mr-2"></i>${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}`;
}

// Cargar tareas desde localStorage
function loadTasks() {
    const localData = localStorage.getItem('taskflow_tasks');
    if (localData) {
        try {
            tasks = JSON.parse(localData);
        } catch (e) {
            console.error("Error al parsear tareas desde localStorage", e);
            tasks = [];
        }
    }
    if (tasks.length === 0) {
        tasks = [{
            id: '1',
            title: 'Bienvenido a TaskFlow 🚀',
            desc: 'Esta es una tarea de ejemplo. Puedes marcarla como completada, editarla o eliminarla.',
            priority: 'alta',
            category: 'Trabajo',
            dueDate: new Date().toISOString().split('T')[0],
            dueTime: '',
            completed: false,
            createdAt: Date.now() - 100000,
            notified: false
        }];
        saveTasks();
    }
}

// Guardar tareas en localStorage
function saveTasks() {
    localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
    updateStats();
}

// Actualizar el panel de estadísticas
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    statTotal.textContent = total;
    statPending.textContent = pending;
    statCompleted.textContent = completed;
    statPercent.textContent = `${percent}%`;
    statProgressBar.style.width = `${percent}%`;
}

// Configurar los event listeners
function setupEventListeners() {
    taskForm.addEventListener('submit', handleAddTask);

    statusFilters.forEach(button => {
        button.addEventListener('click', () => {
            statusFilters.forEach(btn => btn.classList.remove('active-filter'));
            button.classList.add('active-filter');
            currentFilters.status = button.dataset.filter;
            renderTasks();
        });
    });

    [categoryFilter, priorityFilter, sortOrder].forEach(el => {
        el.addEventListener('change', (e) => {
            const filterMap = { 'filter-category': 'category', 'filter-priority': 'priority', 'sort-order': 'sortBy' };
            currentFilters[filterMap[e.target.id]] = e.target.value;
            renderTasks();
        });
    });

    searchInput.addEventListener('input', (e) => {
        currentFilters.search = e.target.value.trim().toLowerCase();
        renderTasks();
    });

    closeFormBtn.addEventListener('click', hideEditModal);
    cancelEditBtn.addEventListener('click', hideEditModal);
    editForm.addEventListener('submit', handleEditTask);

    editModal.addEventListener('click', (e) => { if (e.target === editModal) hideEditModal(); });
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
}

// Manejar la adición de tareas
function handleAddTask(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    if (!title) return;

    const newTask = {
        id: Date.now().toString(),
        title,
        desc: document.getElementById('task-desc').value.trim(),
        priority: document.getElementById('task-priority').value,
        category: document.getElementById('task-category').value,
        dueDate: document.getElementById('task-due-date').value,
        dueTime: document.getElementById('task-due-time').value,
        completed: false,
        createdAt: Date.now(),
        notified: false
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    taskForm.reset();
}

// Marcar/desmarcar tarea como completada
function toggleTask(id) {
    tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
    saveTasks();
    renderTasks();
}

// Eliminar tarea
function deleteTask(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }
}

// Abrir el modal de edición
function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-title').value = task.title;
    document.getElementById('edit-desc').value = task.desc;
    document.getElementById('edit-priority').value = task.priority;
    document.getElementById('edit-category').value = task.category;
    document.getElementById('edit-due-date').value = task.dueDate || '';
    document.getElementById('edit-due-time').value = task.dueTime || '';

    editModal.classList.remove('hidden');
    setTimeout(() => {
        editModal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
    }, 10);
}

// Ocultar el modal de edición
function hideEditModal() {
    editModal.classList.add('opacity-0');
    modalContent.classList.add('scale-95');
    setTimeout(() => editModal.classList.add('hidden'), 300);
}

// Manejar el envío del formulario de edición
function handleEditTask(e) {
    e.preventDefault();
    const id = document.getElementById('edit-task-id').value;
    const title = document.getElementById('edit-title').value.trim();
    if (!title) return;

    tasks = tasks.map(task => {
        if (task.id === id) {
            return {
                ...task,
                title,
                desc: document.getElementById('edit-desc').value.trim(),
                priority: document.getElementById('edit-priority').value,
                category: document.getElementById('edit-category').value,
                dueDate: document.getElementById('edit-due-date').value,
                dueTime: document.getElementById('edit-due-time').value,
                notified: false // Resetear notificación al editar
            };
        }
        return task;
    });

    saveTasks();
    renderTasks();
    hideEditModal();
}

// Obtener insignia de categoría
function getCategoryBadge(category) {
    const categories = {
        'Trabajo': { icon: '💼', classes: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/50' },
        'Personal': { icon: '🏠', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/50' },
        'Compras': { icon: '🛒', classes: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/50' },
        'Estudio': { icon: '📚', classes: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/50 dark:text-violet-300 dark:border-violet-800/50' }
    };
    const details = categories[category] || { icon: '✨', classes: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${details.classes}"><span>${details.icon}</span> ${category}</span>`;
}

// Obtener insignia de prioridad
function getPriorityBadge(priority) {
    const priorities = {
        'baja': { label: 'Baja', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/50' },
        'media': { label: 'Media', classes: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/50' },
        'alta': { label: 'Alta', classes: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800/50' }
    };
    const details = priorities[priority] || priorities['baja'];
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${details.classes}">${details.label}</span>`;
}

// Formatear fecha de vencimiento y verificar si está vencida
function formatDueDate(dueDate, dueTime, completed) {
    if (!dueDate) return '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDateTime = dueTime ? new Date(`${dueDate}T${dueTime}`) : new Date(dueDate + 'T23:59:59');

    let dateLabel = '';
    const diffDays = (new Date(dueDate + 'T00:00:00').getTime() - today.getTime()) / (1000 * 3600 * 24);

    if (diffDays >= 0 && diffDays < 1) dateLabel = 'Hoy';
    else if (diffDays >= 1 && diffDays < 2) dateLabel = 'Mañana';
    else {
        dateLabel = new Date(dueDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }

    if (dueTime) {
        dateLabel += ` a las ${dueTime}`;
    }

    const isOverdue = !completed && dueDateTime < now;
    const badgeColor = isOverdue
        ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800/50 animate-pulse'
        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${badgeColor}">
        <i class="fa-regular fa-calendar text-[10px]"></i>
        <span>${isOverdue ? 'Vencido: ' : ''}${dateLabel}</span>
    </span>`;
}


// Filtrar, ordenar y renderizar tareas
function renderTasks() {
    let filteredTasks = [...tasks];

    // 1. Filtrar por estado
    if (currentFilters.status === 'pending') filteredTasks = filteredTasks.filter(t => !t.completed);
    else if (currentFilters.status === 'completed') filteredTasks = filteredTasks.filter(t => t.completed);

    // 2. Filtrar por categoría y prioridad
    if (currentFilters.category !== 'all') filteredTasks = filteredTasks.filter(t => t.category === currentFilters.category);
    if (currentFilters.priority !== 'all') filteredTasks = filteredTasks.filter(t => t.priority === currentFilters.priority);

    // 3. Filtrar por búsqueda
    if (currentFilters.search) {
        filteredTasks = filteredTasks.filter(t =>
            t.title.toLowerCase().includes(currentFilters.search) ||
            t.desc.toLowerCase().includes(currentFilters.search)
        );
    }

    // 4. Ordenar
    const priorityWeight = { alta: 3, media: 2, baja: 1 };
    filteredTasks.sort((a, b) => {
        switch (currentFilters.sortBy) {
            case 'newest': return b.createdAt - a.createdAt;
            case 'oldest': return a.createdAt - b.createdAt;
            case 'dueDate':
                const aDate = a.dueDate ? new Date(`${a.dueDate}T${a.dueTime || '00:00'}`).getTime() : Infinity;
                const bDate = b.dueDate ? new Date(`${b.dueDate}T${b.dueTime || '00:00'}`).getTime() : Infinity;
                return aDate - bDate;
            case 'priority': return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
            default: return 0;
        }
    });

    tasksContainer.innerHTML = '';

    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="bg-white dark:bg-slate-800/50 p-12 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm text-center animate-slide-up">
                <div class="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
                    <i class="fa-solid fa-folder-open text-2xl"></i>
                </div>
                <h3 class="text-base font-bold text-slate-700 dark:text-slate-200">No se encontraron tareas</h3>
                <p class="text-slate-400 dark:text-slate-500 text-sm mt-1">Prueba cambiando los filtros o agregando una nueva tarea.</p>
            </div>`;
        return;
    }

    filteredTasks.forEach(task => {
        const card = document.createElement('div');
        const isCompleted = task.completed;
        card.className = `task-card bg-white dark:bg-slate-800 p-5 rounded-2xl border ${isCompleted ? 'border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30' : 'border-slate-100 dark:border-slate-700/50'} shadow-sm flex items-start gap-4 animate-slide-up`;
        card.dataset.id = task.id;

        const completedClass = isCompleted ? 'completed-task text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100';
        const completedDescClass = isCompleted ? 'completed-task' : 'text-slate-500 dark:text-slate-400';

        card.innerHTML = `
            <label class="custom-checkbox mt-1">
                <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="toggleTask('${task.id}')">
                <span class="checkbox-checkmark"></span>
            </label>
            <div class="flex-1 min-w-0">
                <div class="flex flex-col sm:flex-row sm:items-center gap-2 justify-between mb-1">
                    <h3 class="text-base font-bold ${completedClass} wrap-break-word leading-snug">${task.title}</h3>
                    <div class="flex flex-wrap gap-1.5 items-center flex-shrink-0">
                        ${getPriorityBadge(task.priority)}
                        ${getCategoryBadge(task.category)}
                    </div>
                </div>
                ${task.desc ? `<p class="text-sm ${completedDescClass} wrap-break-word mt-1 leading-relaxed">${task.desc}</p>` : ''}
                <div class="mt-3">
                    ${formatDueDate(task.dueDate, task.dueTime, isCompleted)}
                </div>
            </div>
            <div class="flex items-center gap-1 self-start sm:self-center ml-2 border-l border-slate-100 dark:border-slate-700 pl-3">
                <button onclick="openEditModal('${task.id}')" title="Editar tarea" class="action-btn"><i class="fa-solid fa-pencil text-sm"></i></button>
                <button onclick="deleteTask('${task.id}')" title="Eliminar tarea" class="action-btn-danger"><i class="fa-solid fa-trash-can text-sm"></i></button>
            </div>`;
        tasksContainer.appendChild(card);
    });
}

// --- Sistema de notificaciones ---
function initNotifications() {
    if (!("Notification" in window)) {
        console.log("Este navegador no soporta notificaciones de escritorio.");
        return;
    }
    if (Notification.permission !== "granted") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Permiso de notificaciones concedido.");
                setInterval(checkTaskDeadlines, 60000); // Revisar cada minuto
            }
        });
    } else {
        setInterval(checkTaskDeadlines, 60000); // Revisar cada minuto
    }
}

function checkTaskDeadlines() {
    const now = new Date();
    tasks.forEach((task, index) => {
        if (task.completed || !task.dueDate || !task.dueTime) return;

        const dueDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
        const diffMinutes = (dueDateTime.getTime() - now.getTime()) / (1000 * 60);

        // Recordatorio 15 minutos antes
        if (diffMinutes > 0 && diffMinutes <= 15 && !tasks[index].notified) {
            sendNotification(`Recordatorio: ${task.title}`, `Esta tarea vence en menos de 15 minutos.`);
            tasks[index].notified = true;
            saveTasks();
        }

        // Notificación de tarea vencida
        if (diffMinutes < 0 && !tasks[index].notified) {
            sendNotification(`Tarea Vencida: ${task.title}`, `Esta tarea ha vencido.`);
            tasks[index].notified = true;
            saveTasks();
        }
    });
}

function sendNotification(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { body });
    }
}



// 1. Descarga tus tareas en un archivo .json (Compatible con Safari móvil)
function exportarTareas() {
    if (!tasks || tasks.length === 0) {
        return alert("No tienes tareas guardadas para exportar.");
    }
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "taskflow_backup.json";
    a.click();
    URL.revokeObjectURL(url);
}

// 2. Lee el archivo o acepta el texto copiado de la app vieja
function importarTareas(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsedTasks = JSON.parse(e.target.result);
            
            if (Array.isArray(parsedTasks)) {
                // Reemplaza las tareas actuales por las importadas
                tasks = parsedTasks; 
                // Usa tu función original para guardar y actualizar la pantalla
                saveTasks(); 
                alert("¡Tareas importadas con éxito!");
                location.reload();
            } else {
                alert("El formato del archivo no es un listado de tareas válido.");
            }
        } catch (error) {
            alert("Error al leer el archivo de copia de seguridad.");
        }
    };
    reader.readAsText(file);
}
