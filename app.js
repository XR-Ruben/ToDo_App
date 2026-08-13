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

// --- Configuración de notificaciones ---
const DEFAULT_NOTIFICATION_SETTINGS = {
    sound: true,          // Reproducir timbre al recibir notificación
    vibration: true,      // Vibrar en dispositivos móviles
    reminderMinutes: 5,   // Minutos antes del vencimiento para recordar
    notifyOverdue: true   // Notificar tareas vencidas
};

function getNotificationSettings() {
    try {
        const saved = localStorage.getItem('taskflow_notification_settings');
        if (saved) return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
        console.warn('Error parsing notification settings', e);
    }
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
}

function saveNotificationSettings(settings) {
    localStorage.setItem('taskflow_notification_settings', JSON.stringify(settings));
}

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
    loadFilters(); // Cargar filtros guardados
    displayCurrentDate();
    setupEventListeners();
    renderTasks();
    initNotifications();
    const settings = getNotificationSettings();
    updateSoundToggle(settings.sound);
    renderNotificationStatus();
    updateNotificationSettingsUI();
});

// --- Funciones de persistencia de filtros ---
function saveFilters() {
    localStorage.setItem('taskflow_filters', JSON.stringify(currentFilters));
}

function loadFilters() {
    const savedFilters = localStorage.getItem('taskflow_filters');
    if (savedFilters) {
        try {
            currentFilters = JSON.parse(savedFilters);
            
            // Actualizar la UI para que coincida con los filtros cargados
            statusFilters.forEach(button => {
                button.classList.toggle('active-filter', button.dataset.filter === currentFilters.status);
                // Asegurar que solo el activo tenga el estilo principal
                if (button.dataset.filter === currentFilters.status) {
                    button.classList.add('bg-indigo-50', 'text-indigo-700', 'border-indigo-100');
                    button.classList.remove('bg-slate-50', 'dark:bg-slate-700', 'text-slate-600', 'dark:text-slate-300');
                } else {
                    button.classList.remove('bg-indigo-50', 'text-indigo-700', 'border-indigo-100');
                    button.classList.add('bg-slate-50', 'dark:bg-slate-700', 'text-slate-600', 'dark:text-slate-300');
                }
            });

            categoryFilter.value = currentFilters.category;
            priorityFilter.value = currentFilters.priority;
            sortOrder.value = currentFilters.sortBy;
            searchInput.value = currentFilters.search;

        } catch (e) {
            console.error("Error al parsear filtros desde localStorage", e);
        }
    }
}


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
            createdAt: Date.now() - 100000
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
            currentFilters.status = button.dataset.filter;
            saveFilters();
            renderTasks();
        });
    });

    [categoryFilter, priorityFilter, sortOrder].forEach(el => {
        el.addEventListener('change', (e) => {
            const filterMap = { 'filter-category': 'category', 'filter-priority': 'priority', 'sort-order': 'sortBy' };
            currentFilters[filterMap[e.target.id]] = e.target.value;
            saveFilters();
            renderTasks();
        });
    });

    searchInput.addEventListener('input', (e) => {
        currentFilters.search = e.target.value.trim().toLowerCase();
        saveFilters();
        renderTasks();
    });

    closeFormBtn.addEventListener('click', hideEditModal);
    cancelEditBtn.addEventListener('click', hideEditModal);
    editForm.addEventListener('submit', handleEditTask);

        editModal.addEventListener('click', (e) => { if (e.target === editModal) hideEditModal(); });
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    // Botón de toggle de sonido (timbre)
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) soundToggle.addEventListener('click', toggleNotificationSound);

    // Botón de notificación de prueba
    const testNotificationBtn = document.getElementById('test-notification');
    if (testNotificationBtn) testNotificationBtn.addEventListener('click', testNotification);
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
        createdAt: Date.now()
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
                dueTime: document.getElementById('edit-due-time').value
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
                    <h3 class="text-base font-bold ${completedClass} break-words leading-snug">${task.title}</h3>
                    <div class="flex flex-wrap gap-1.5 items-center flex-shrink-0">
                        ${getPriorityBadge(task.priority)}
                        ${getCategoryBadge(task.category)}
                    </div>
                </div>
                ${task.desc ? `<p class="text-sm ${completedDescClass} break-words mt-1 leading-relaxed">${task.desc}</p>` : ''}
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

// --- Sistema de notificaciones Push ---
// Inicializa el sistema de notificaciones: solicita permiso, registra el SW,
// inicia la comprobación de vencimientos y prepara la UI de notificaciones.
async function initNotifications() {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        console.log("Notificaciones Push no son soportadas en este navegador.");
        return;
    }

    // Solicitar permiso de notificaciones
    let permission = await Notification.requestPermission();
    console.log('Estado del permiso de notificación:', permission);

    if (permission === 'granted') {
        // Iniciar el chequeo de vencimientos
        setInterval(checkTaskDeadlines, 60000); // Revisar cada minuto
        checkTaskDeadlines(); // Revisar inmediatamente al cargar
    }

    // Preparar registro del service worker y suscripción Push
    if (navigator.serviceWorker) {
        try {
            const reg = await navigator.serviceWorker.ready;
            window.swReg = reg;
            initPushUI();

            // Escuchar mensajes desde el Service Worker (para reproducir timbre)
            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        } catch (err) {
            console.warn('Service Worker no listo:', err);
        }
    }
}

// Manejar mensajes del Service Worker (p. ej. reproducir timbre al recibir push)
function handleServiceWorkerMessage(event) {
    if (!event.data) return;

    if (event.data.action === 'play-sound') {
        const url = event.data.soundUrl;
        const replyPort = event.ports && event.ports[0];

        (async () => {
            try {
                if (url) {
                    try {
                        const audio = new Audio(url);
                        await audio.play().catch(err => {
                            console.warn('No se pudo reproducir audio mp3, usando WebAudio de respaldo', err);
                            playSound();
                        });
                    } catch (err) {
                        console.warn('Error creando Audio element, usando WebAudio', err);
                        playSound();
                    }
                } else {
                    playSound();
                }
            } catch (err) {
                console.warn('Error al reproducir sonido', err);
            }

            // Responder al Service Worker si se proporcionó un MessagePort
            if (replyPort) {
                try { replyPort.postMessage({ ok: true }); } catch (e) { /* ignore */ }
            }
        })();
    }
}

// Mostrar el estado de permisos de notificaciones en la UI
function renderNotificationStatus() {
    const statusEl = document.getElementById('notification-status');
    if (!statusEl) return;

    if (Notification.permission === 'granted') {
        statusEl.innerHTML = '<i class="fa-solid fa-check text-green-500 mr-1"></i> Activadas';
        statusEl.className = 'text-xs font-medium text-green-600 dark:text-green-400';
    } else if (Notification.permission === 'denied') {
        statusEl.innerHTML = '<i class="fa-solid fa-xmark text-red-500 mr-1"></i> Bloqueadas';
        statusEl.className = 'text-xs font-medium text-red-600 dark:text-red-400';
    } else {
        statusEl.innerHTML = '<i class="fa-solid fa-bell-slash text-slate-400 mr-1"></i> Sin permiso';
        statusEl.className = 'text-xs font-medium text-slate-500';
    }
}

// Alternar sonido de notificaciones (timbre)
function toggleNotificationSound() {
    const settings = getNotificationSettings();
    settings.sound = !settings.sound;
    saveNotificationSettings(settings);
    updateSoundToggle(settings.sound);
    updateNotificationSettingsUI();
}

// Actualizar la UI del botón de sonido según la configuración
function updateSoundToggle(isSoundOn) {
    const btn = document.getElementById('sound-toggle');
    const icon = document.getElementById('sound-icon');
    if (!btn || !icon) return;

    if (isSoundOn) {
        icon.className = 'fa-solid fa-bell-ring';
        btn.title = 'Desactivar timbre';
        btn.classList.add('ring-2', 'ring-indigo-400');
    } else {
        icon.className = 'fa-solid fa-bell-slash';
        btn.title = 'Activar timbre';
        btn.classList.remove('ring-2', 'ring-indigo-400');
    }
}

// Enviar una notificación de prueba (local y/o push)
function testNotification() {
    const settings = getNotificationSettings();

    sendNotification('🧪 Notificación de Prueba',
        'TaskFlow funciona correctamente. ¡Las notificaciones push están activas!',
        {
            tag: 'test-notification',
            playSound: true
        }
    );

    // Intentar enviar push a través del servidor si hay suscripción guardada
    const sub = JSON.parse(localStorage.getItem('taskflow_push_subscription') || 'null');
    if (sub) {
        fetch('/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscription: sub,
                title: '🚀 Push Test',
                body: 'Notificación push de prueba desde el servidor',
                url: '/',
                playSound: settings.sound
            })
        }).catch(e => console.warn('No se pudo enviar push de prueba al servidor:', e));
    }
}

// ===== Panel de configuración de notificaciones =====

// Alternar visibilidad del panel de configuración
function toggleNotificationSettings() {
    const panel = document.getElementById('notification-settings');
    if (!panel) return;
    panel.classList.toggle('hidden');
    updateNotificationSettingsUI();
}

// Sincronizar la UI del panel con la configuración guardada
function updateNotificationSettingsUI() {
    const settings = getNotificationSettings();

    // Knob de sonido
    const soundKnob = document.getElementById('sound-knob');
    const soundToggle = document.getElementById('sound-toggle-settings');
    if (soundKnob && soundToggle) {
        soundKnob.style.transform = settings.sound ? 'translateX(16px)' : 'translateX(0)';
        soundToggle.className = settings.sound
            ? 'relative w-12 h-6 rounded-full transition-colors bg-indigo-500'
            : 'relative w-12 h-6 rounded-full transition-colors bg-slate-200 dark:bg-slate-600';
    }

    // Knob de vibración
    const vibKnob = document.getElementById('vibration-knob');
    const vibToggle = document.getElementById('vibration-toggle');
    if (vibKnob && vibToggle) {
        vibKnob.style.transform = settings.vibration ? 'translateX(16px)' : 'translateX(0)';
        vibToggle.className = settings.vibration
            ? 'relative w-12 h-6 rounded-full transition-colors bg-indigo-500'
            : 'relative w-12 h-6 rounded-full transition-colors bg-slate-200 dark:bg-slate-600';
    }

    // Knob de notificaciones vencidas
    const overdueKnob = document.getElementById('overdue-knob');
    const overdueToggle = document.getElementById('overdue-toggle');
    if (overdueKnob && overdueToggle) {
        overdueKnob.style.transform = settings.notifyOverdue ? 'translateX(16px)' : 'translateX(0)';
        overdueToggle.className = settings.notifyOverdue
            ? 'relative w-12 h-6 rounded-full transition-colors bg-indigo-500'
            : 'relative w-12 h-6 rounded-full transition-colors bg-slate-200 dark:bg-slate-600';
    }

    // Slider de recordatorio
    const reminderSlider = document.getElementById('reminder-minutes');
    const reminderValue = document.getElementById('reminder-value');
    if (reminderSlider) reminderSlider.value = settings.reminderMinutes;
    if (reminderValue) reminderValue.textContent = settings.reminderMinutes;
}

// Alternar vibración
function toggleVibration() {
    const settings = getNotificationSettings();
    settings.vibration = !settings.vibration;
    saveNotificationSettings(settings);
    updateNotificationSettingsUI();
}

// Actualizar minutos de recordatorio
function updateReminderMinutes(value) {
    const settings = getNotificationSettings();
    settings.reminderMinutes = parseInt(value);
    saveNotificationSettings(settings);
    const reminderValue = document.getElementById('reminder-value');
    if (reminderValue) reminderValue.textContent = value;
}

// Alternar notificaciones de tareas vencidas
function toggleNotifyOverdue() {
    const settings = getNotificationSettings();
    settings.notifyOverdue = !settings.notifyOverdue;
    saveNotificationSettings(settings);
    updateNotificationSettingsUI();
}

// Enviar una notificación programada de prueba con el mensaje de la tarea
function sendTestScheduledNotification() {
    const settings = getNotificationSettings();
    sendNotification('⏰ Recordatorio Programado',
        settings.reminderMinutes > 0
            ? `Notificación de prueba con recordatorio ${settings.reminderMinutes} minutos antes del vencimiento.`
            : 'Notificación de prueba sin recordatorio anticipado.',
        { tag: 'scheduled-test', playSound: settings.sound }
    );
}

// Limpiar el historial de tareas notificadas (permite notificar de nuevo)
function clearNotifiedTasks() {
    if (!confirm('¿Estás seguro de que quieres limpiar el historial de notificaciones? Se volverán a notificar las tareas pendientes.')) return;
    localStorage.removeItem('notifiedTasks');
    const settings = getNotificationSettings();
    updateNotificationSettingsUI();
    alert('Historial de notificaciones limpiado. Las tareas pendientes se volverán a notificar.');
}

// ------------------------
// Push subscription helpers
// ------------------------
let VAPID_PUBLIC_KEY = null; // se intentará obtener dinámicamente

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function initPushUI() {
    const btn = document.getElementById('push-toggle');
    const icon = document.getElementById('push-icon');
    if (!btn || !window.swReg) return;

    // Mostrar estado inicial
    window.swReg.pushManager.getSubscription().then(sub => {
        updatePushButton(sub, icon);
    });

    btn.addEventListener('click', async () => {
        const sub = await window.swReg.pushManager.getSubscription();
        if (sub) {
            // Desuscribir
            await sub.unsubscribe();
            localStorage.removeItem('taskflow_push_subscription');
            updatePushButton(null, icon);
            renderNotificationStatus();
            alert('Notificaciones push desactivadas');
            return;
        }

        // Suscribirse
        try {
            // Obtener la clave pública VAPID si no la tenemos
            if (!VAPID_PUBLIC_KEY) {
                VAPID_PUBLIC_KEY = await fetchVapidPublicKey();
            }
            if (!VAPID_PUBLIC_KEY) {
                alert('No se pudo obtener la clave pública VAPID. Revisa el servidor o el archivo vapid-keys.json.');
                return;
            }
            const subscription = await window.swReg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            // Guardar localmente y opcionalmente enviar al servidor
            localStorage.setItem('taskflow_push_subscription', JSON.stringify(subscription));
            updatePushButton(subscription, icon);
            renderNotificationStatus();
            alert('Notificaciones push activadas. ¡Listo para recibir recordatorios de tareas!');
            // Intentar enviar la suscripción a endpoints conocidos (local o Netlify Functions)
            postSubscriptionToServer(subscription).catch(e => console.warn('No se pudo enviar la suscripción al servidor:', e));
        } catch (err) {
            console.error('Error suscribiendo a push:', err);
            alert('No se pudo activar notificaciones push. Revisa la consola.');
        }
    });

    // Nota: El listener de mensajes del Service Worker ahora está en initNotifications()
}

// Intenta obtener la clave pública VAPID desde varios endpoints (local dev o Netlify Functions)
async function fetchVapidPublicKey() {
    // Clave VAPID publica embebida como respaldo (para funcionar sin servidor)
    const EMBEDDED_VAPID_KEY = 'BFI_XFfTMXAWEGUH77br9ioLABEqBol7Yw-gNDe2r58Fwz9gk9Ra2x2S14n6J4s5jXgXaeoNkhBnW4d4w7ecH5Y';
    // Priorizar el servidor local para evitar devolver HTML desde el servidor estático
    const candidates = [
        'http://localhost:3000/vapidPublicKey',
        '/.netlify/functions/vapidPublicKey',
        '/vapidPublicKey'
    ];
    for (const url of candidates) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.warn('fetchVapidPublicKey: non-ok response', url, res.status);
                continue;
            }
            let text = await res.text();
            if (!text) continue;
            text = text.trim();
            // Si el servidor devolvió JSON { publicKey: '...' }
            try {
                const parsed = JSON.parse(text);
                if (parsed && parsed.publicKey) text = parsed.publicKey;
            } catch (e) {
                // no es JSON, seguir
            }
            // Normalizar: quitar comillas envolventes y saltos de línea
            text = text.replace(/^"(.*)"$/, '$1').replace(/\r?\n/g, '').trim();
            // Validar que parezca una clave base64url (caracteres URL-safe)
            if (text && text.length > 30 && /^[A-Za-z0-9\-_]+$/.test(text)) return text;
            console.warn('fetchVapidPublicKey: respuesta no válida de', url, text.slice(0, 120));
        } catch (err) {
                        console.warn('fetchVapidPublicKey: error fetching', url, err);
        }
    }
    // Respaldo: si ningun endpoint responde, usar la clave embebida
    return EMBEDDED_VAPID_KEY;
}

async function postSubscriptionToServer(subscription) {
    const endpoints = [
        '/subscribe',
        '/.netlify/functions/save-subscription',
        'http://localhost:3000/subscribe'
    ];
    for (const url of endpoints) {
        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription) });
            if (res.ok) return true;
        } catch (e) {
            // sigue
        }
    }
    throw new Error('No endpoints aceptaron la suscripción');
}

function updatePushButton(subscription, iconEl) {
    if (subscription) {
        iconEl.classList.remove('fa-bell');
        iconEl.classList.add('fa-bell-slash');
        iconEl.title = 'Desactivar notificaciones';
    } else {
        iconEl.classList.remove('fa-bell-slash');
        iconEl.classList.add('fa-bell');
        iconEl.title = 'Activar notificaciones';
    }
}

// Reproducir timbre de campana agradable usando WebAudio (doble oscilador)
function playSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();

        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const g1 = ctx.createGain();
        const g2 = ctx.createGain();

        // Acorde de campana: E5 + A5 (sonido agradable y perceptible)
        o1.type = 'sine';
        o1.frequency.value = 660; // E5
        o2.type = 'sine';
        o2.frequency.value = 880; // A5

        o1.connect(g1);
        o2.connect(g2);
        g1.connect(ctx.destination);
        g2.connect(ctx.destination);

        g1.gain.value = 0;
        g2.gain.value = 0;

        o1.start();
        o2.start();

        // Deslizamiento suave de frecuencias para un sonido más rico
        o1.frequency.exponentialRampToValueAtTime(620, ctx.currentTime + 0.3);
        o2.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.4);

        // Envelope de ataque-rápido, decaimiento-lento
        g1.gain.setValueAtTime(0, ctx.currentTime);
        g1.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01);
        g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        g2.gain.setValueAtTime(0, ctx.currentTime);
        g2.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

        setTimeout(() => { o1.stop(); o2.stop(); }, 800);
        setTimeout(() => { ctx.close(); }, 900);
    } catch (e) {
        console.warn('No se pudo reproducir sonido:', e);
    }
}

// Verificar y notificar tareas próximas a vencer o vencidas
function checkTaskDeadlines() {
    const now = new Date();
    const notifiedTasks = new Set(JSON.parse(localStorage.getItem('notifiedTasks') || '[]'));
    const settings = getNotificationSettings();
    const remindBefore = settings.reminderMinutes || 5;

    tasks.forEach(task => {
        if (!task.dueDate || !task.dueTime) return;

        const dueDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
        const diffMs = dueDateTime.getTime() - now.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        // Notificar recordatorio: cuando la tarea vence en los próximos X minutos
        if (!task.completed &&
            diffMinutes <= remindBefore &&
            diffMinutes > -remindBefore &&
            !notifiedTasks.has(task.id)) {

            const isOverdue = diffMinutes <= 0;
            const title = isOverdue
                ? `⚠️ ${task.title}`
                : `Recordatorio: ${task.title}`;
            const body = task.desc || '¡Es hora de trabajar en esta tarea!';

            sendNotification(title, body, {
                url: '/',
                taskId: task.id,
                tag: 'task-' + task.id,
                playSound: true
            });
            notifiedTasks.add(task.id);
        }

        // Notificar tareas vencidas (una sola vez, si está configurado)
        if (!task.completed &&
            settings.notifyOverdue &&
            diffMs < -remindBefore * 60 * 1000 &&
            !notifiedTasks.has(task.id + '_overdue')) {

            sendNotification(
                `¡Urgente! Tarea vencida: ${task.title}`,
                task.desc || 'Esta tarea ya venció. ¡Complétala ya!',
                {
                    url: '/',
                    taskId: task.id,
                    tag: 'overdue-' + task.id,
                    requireInteraction: true,
                    playSound: true
                }
            );
            notifiedTasks.add(task.id + '_overdue');
        }
    });

    localStorage.setItem('notifiedTasks', JSON.stringify([...notifiedTasks]));
}

// Mostrar una notificación (local vía Service Worker) con el mensaje de la tarea
function sendNotification(title, body, options = {}) {
    const settings = getNotificationSettings();
    if (Notification.permission !== "granted") return;

    const notificationOptions = {
        body: body,
        icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
        tag: options.tag || 'taskflow-notification',
        data: {
            url: options.url || '/',
            taskId: options.taskId || null,
            playSound: settings.sound && (options.playSound !== false)
        },
        vibrate: settings.vibration ? [200, 100, 200] : [],
        requireInteraction: options.requireInteraction || false,
        silent: settings.sound && options.playSound !== false ? false : true
    };

    if ('serviceWorker' in navigator && window.swReg) {
        window.swReg.showNotification(title, notificationOptions).then(() => {
            // Reproducir timbre localmente al mostrar la notificación
            if (notificationOptions.data.playSound) {
                setTimeout(() => playSound(), 100);
            }
        }).catch(err => {
            console.warn('Error mostrando notificación vía SW:', err);
            // Fallback: notificación nativa
            new Notification(title, { body: body });
            if (notificationOptions.data.playSound) {
                setTimeout(() => playSound(), 100);
            }
        });
    } else {
        // Sin Service Worker disponible
        new Notification(title, { body: body });
        if (notificationOptions.data.playSound) {
            setTimeout(() => playSound(), 100);
        }
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
