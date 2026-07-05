// Task State
let tasks = [];

// Current filter state
let currentFilters = {
    status: 'all',
    category: 'all',
    priority: 'all',
    search: '',
    sortBy: 'newest'
};

// DOM Elements
const taskForm = document.getElementById('task-form');
const tasksContainer = document.getElementById('tasks-container');
const currentDateEl = document.getElementById('current-date');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const statPercent = document.getElementById('stat-percent');
const statProgressBar = document.getElementById('stat-progress-bar');

// Filter Elements
const statusFilters = document.querySelectorAll('#status-filters button');
const categoryFilter = document.getElementById('filter-category');
const priorityFilter = document.getElementById('filter-priority');
const sortOrder = document.getElementById('sort-order');
const searchInput = document.getElementById('search-input');

// Edit Modal Elements
const editModal = document.getElementById('edit-modal');
const modalContent = document.getElementById('modal-content');
const editForm = document.getElementById('edit-form');
const closeFormBtn = document.getElementById('close-modal');
const cancelEditBtn = document.getElementById('cancel-edit');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    displayCurrentDate();
    setupEventListeners();
    renderTasks();
});

// Setup Date display
function displayCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    // Capitalize first letter
    let dateStr = today.toLocaleDateString('es-ES', options);
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    currentDateEl.innerHTML = `<i class="fa-regular fa-calendar-days text-indigo-500 mr-2"></i>${dateStr}`;
}

// Load tasks from localStorage
function loadTasks() {
    const localData = localStorage.getItem('taskflow_tasks');
    if (localData) {
        try {
            tasks = JSON.parse(localData);
        } catch (e) {
            console.error("Error parsing tasks from local storage", e);
            tasks = [];
        }
    } else {
        // Sample Tasks if empty
        tasks = [
            {
                id: '1',
                title: 'Bienvenido a TaskFlow 🚀',
                desc: 'Esta es una tarea de ejemplo. Puedes marcarla como completada usando el checkbox de la izquierda, editarla con el icono de lápiz o eliminarla con el icono de basura.',
                priority: 'alta',
                category: 'Trabajo',
                dueDate: new Date().toISOString().split('T')[0],
                completed: false,
                createdAt: new Date().getTime() - 100000
            },
            {
                id: '2',
                title: 'Comprar provisiones de la semana 🛒',
                desc: 'Leche, huevos, frutas frescas y café para la oficina.',
                priority: 'baja',
                category: 'Compras',
                dueDate: '',
                completed: true,
                createdAt: new Date().getTime() - 200000
            }
        ];
        saveTasks();
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
    updateStats();
}

// Update stats dashboard
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

// Setup Event Listeners
function setupEventListeners() {
    // Add Task Form Submit
    taskForm.addEventListener('submit', handleAddTask);

    // Filter Buttons (Status)
    statusFilters.forEach(button => {
        button.addEventListener('click', () => {
            statusFilters.forEach(btn => {
                btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent";
            });
            button.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all bg-indigo-50 text-indigo-700 border border-indigo-100";
            currentFilters.status = button.getAttribute('data-filter');
            renderTasks();
        });
    });

    // Category Filter
    categoryFilter.addEventListener('change', (e) => {
        currentFilters.category = e.target.value;
        renderTasks();
    });

    // Priority Filter
    priorityFilter.addEventListener('change', (e) => {
        currentFilters.priority = e.target.value;
        renderTasks();
    });

    // Sort Order
    sortOrder.addEventListener('change', (e) => {
        currentFilters.sortBy = e.target.value;
        renderTasks();
    });

    // Search Input (Debounced or keyup)
    searchInput.addEventListener('input', (e) => {
        currentFilters.search = e.target.value.trim().toLowerCase();
        renderTasks();
    });

    // Edit Modal Close
    closeFormBtn.addEventListener('click', hideEditModal);
    cancelEditBtn.addEventListener('click', hideEditModal);
    editForm.addEventListener('submit', handleEditTask);

    // Close Modal on clicking background
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) hideEditModal();
    });
}

// Handle Add Task
function handleAddTask(e) {
    e.preventDefault();

    const title = document.getElementById('task-title').value.trim();
    const desc = document.getElementById('task-desc').value.trim();
    const priority = document.getElementById('task-priority').value;
    const category = document.getElementById('task-category').value;
    const dueDate = document.getElementById('task-due-date').value;

    if (!title) return;

    const newTask = {
        id: Date.now().toString(),
        title,
        desc,
        priority,
        category,
        dueDate,
        completed: false,
        createdAt: Date.now()
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();

    // Reset Form
    taskForm.reset();
}

// Toggle Task Completed
function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

// Delete Task
function deleteTask(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }
}

// Open Edit Modal
function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-title').value = task.title;
    document.getElementById('edit-desc').value = task.desc;
    document.getElementById('edit-priority').value = task.priority;
    document.getElementById('edit-category').value = task.category;
    document.getElementById('edit-due-date').value = task.dueDate || '';

    // Show Modal with Animation
    editModal.classList.remove('hidden');
    setTimeout(() => {
        editModal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
    }, 10);
}

// Hide Edit Modal
function hideEditModal() {
    editModal.classList.add('opacity-0');
    modalContent.classList.add('scale-95');
    setTimeout(() => {
        editModal.classList.add('hidden');
    }, 300);
}

// Handle Edit Task Submit
function handleEditTask(e) {
    e.preventDefault();

    const id = document.getElementById('edit-task-id').value;
    const title = document.getElementById('edit-title').value.trim();
    const desc = document.getElementById('edit-desc').value.trim();
    const priority = document.getElementById('edit-priority').value;
    const category = document.getElementById('edit-category').value;
    const dueDate = document.getElementById('edit-due-date').value;

    if (!title) return;

    tasks = tasks.map(task => {
        if (task.id === id) {
            return {
                ...task,
                title,
                desc,
                priority,
                category,
                dueDate
            };
        }
        return task;
    });

    saveTasks();
    renderTasks();
    hideEditModal();
}

// Helper: Get Category Icon and Colors
function getCategoryBadge(category) {
    let icon = '✨';
    let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

    switch (category) {
        case 'Trabajo':
            icon = '💼';
            colorClasses = 'bg-blue-50 text-blue-700 border-blue-100';
            break;
        case 'Personal':
            icon = '🏠';
            colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-100';
            break;
        case 'Compras':
            icon = '🛒';
            colorClasses = 'bg-amber-50 text-amber-700 border-amber-100';
            break;
        case 'Estudio':
            icon = '📚';
            colorClasses = 'bg-violet-50 text-violet-700 border-violet-100';
            break;
    }

    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClasses}">
        <span>${icon}</span> ${category}
    </span>`;
}

// Helper: Get Priority Badge Colors
function getPriorityBadge(priority) {
    let label = 'Baja';
    let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-100';

    if (priority === 'media') {
        label = 'Media';
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-100';
    } else if (priority === 'alta') {
        label = 'Alta';
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-100';
    }

    return `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${colorClasses}">
        ${label}
    </span>`;
}

// Helper: Format Due Date & check if overdue
function formatDueDate(dueDate, completed) {
    if (!dueDate) return '';

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let dateLabel = '';
    let isOverdue = false;

    if (dueDate === todayStr) {
        dateLabel = 'Hoy';
    } else if (dueDate === tomorrowStr) {
        dateLabel = 'Mañana';
    } else {
        const dateObj = new Date(dueDate + 'T00:00:00');
        const options = { day: 'numeric', month: 'short' };
        dateLabel = dateObj.toLocaleDateString('es-ES', options);
    }

    // Check overdue
    if (!completed && dueDate < todayStr) {
        isOverdue = true;
    }

    const badgeColor = isOverdue 
        ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse' 
        : 'bg-slate-100 text-slate-600 border-slate-200';

    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${badgeColor}">
        <i class="fa-regular fa-calendar text-[10px]"></i>
        <span>${isOverdue ? 'Atrasado: ' : ''}${dateLabel}</span>
    </span>`;
}

// Filter and Sort Tasks and Render
function renderTasks() {
    let filteredTasks = [...tasks];

    // 1. Status Filter
    if (currentFilters.status === 'pending') {
        filteredTasks = filteredTasks.filter(t => !t.completed);
    } else if (currentFilters.status === 'completed') {
        filteredTasks = filteredTasks.filter(t => t.completed);
    }

    // 2. Category Filter
    if (currentFilters.category !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.category === currentFilters.category);
    }

    // 3. Priority Filter
    if (currentFilters.priority !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.priority === currentFilters.priority);
    }

    // 4. Search Filter
    if (currentFilters.search) {
        filteredTasks = filteredTasks.filter(t => 
            t.title.toLowerCase().includes(currentFilters.search) || 
            t.desc.toLowerCase().includes(currentFilters.search)
        );
    }

    // 5. Sorting
    filteredTasks.sort((a, b) => {
        if (currentFilters.sortBy === 'newest') {
            return b.createdAt - a.createdAt;
        } else if (currentFilters.sortBy === 'oldest') {
            return a.createdAt - b.createdAt;
        } else if (currentFilters.sortBy === 'dueDate') {
            // Put items with no due date at the very end
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        } else if (currentFilters.sortBy === 'priority') {
            const priorityWeight = { alta: 3, media: 2, baja: 1 };
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        return 0;
    });

    // Clear Container
    tasksContainer.innerHTML = '';

    // Render empty state if empty
    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center animate-slide-up">
                <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <i class="fa-solid fa-folder-open text-2xl"></i>
                </div>
                <h3 class="text-base font-bold text-slate-700">No se encontraron tareas</h3>
                <p class="text-slate-400 text-sm mt-1">Prueba cambiando los filtros o agregando una nueva tarea.</p>
            </div>
        `;
        return;
    }

    // Render Cards
    filteredTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card bg-white p-5 rounded-2xl border ${task.completed ? 'border-slate-100 bg-slate-50/50' : 'border-slate-100'} shadow-sm flex items-start gap-4 animate-slide-up`;
        card.dataset.id = task.id;

        const dateBadge = formatDueDate(task.dueDate, task.completed);
        const categoryBadge = getCategoryBadge(task.category);
        const priorityBadge = getPriorityBadge(task.priority);

        card.innerHTML = `
            <label class="custom-checkbox mt-1">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')">
                <span class="checkbox-checkmark"></span>
            </label>
            
            <div class="flex-1 min-w-0">
                <div class="flex flex-col sm:flex-row sm:items-center gap-2 justify-between mb-1">
                    <h3 class="text-base font-bold text-slate-800 break-words leading-snug ${task.completed ? 'completed-task text-slate-400' : ''}">
                        ${task.title}
                    </h3>
                    <div class="flex flex-wrap gap-1.5 items-center">
                        ${priorityBadge}
                        ${categoryBadge}
                        ${dateBadge}
                    </div>
                </div>
                
                ${task.desc ? `
                    <p class="text-sm text-slate-500 break-words ${task.completed ? 'completed-task' : ''} mt-1 leading-relaxed">
                        ${task.desc}
                    </p>
                ` : ''}
            </div>

            <div class="flex items-center gap-1 self-start sm:self-center ml-2 border-l border-slate-100 pl-3">
                <button onclick="openEditModal('${task.id}')" title="Editar tarea" 
                    class="text-slate-400 hover:text-indigo-600 p-2 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center">
                    <i class="fa-solid fa-pencil text-sm"></i>
                </button>
                <button onclick="deleteTask('${task.id}')" title="Eliminar tarea" 
                    class="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center">
                    <i class="fa-solid fa-trash-can text-sm"></i>
                </button>
            </div>
        `;

        tasksContainer.appendChild(card);
    });
}
