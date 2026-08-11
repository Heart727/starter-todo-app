/* ==========================================
   待办清单 - 主逻辑
   功能逐步添加，注释按功能区划分
   ========================================== */

// ===== 获取 DOM 元素 =====
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const counter = document.getElementById('counter');

// ===== 数据存储（内存 + localStorage） =====
const STORAGE_KEY = 'todo-app-data';

let todos = [];               // 每个 todo: { id, text, completed }
let currentFilter = 'all';    // 当前筛选：'all' | 'active' | 'completed'

// ===== 功能 6：数据持久化 =====
/** 从 localStorage 加载数据 */
function loadTodos() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // 防止数据格式异常导致页面报错
            todos = Array.isArray(parsed) ? parsed : [];
        }
    } catch (e) {
        // 数据损坏时静默重置
        todos = [];
    }
}

/** 保存数据到 localStorage */
function saveTodos() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (e) {
        // 存储满时忽略（极少发生）
    }
}

/** 清除所有已完成事项 */
function clearCompleted() {
    todos = todos.filter(function (t) { return !t.completed; });
    render();
}

// ===== 工具函数 =====
/** 生成唯一 ID */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ===== 功能 3：删除事项（占位，下一步实现） =====
function deleteTodo(id) {
    todos = todos.filter(function (t) { return t.id !== id; });
    render();
}

// ===== 功能 2：标记完成 / 取消完成 =====
/** 切换完成状态 */
function toggleTodo(id) {
    const todo = todos.find(function (t) { return t.id === id; });
    if (todo) {
        todo.completed = !todo.completed;
        render();
    }
}

// ===== 功能 1：添加待办事项 =====
/** 添加新的待办事项 */
function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return;  // 空内容不添加

    const newTodo = {
        id: generateId(),
        text: trimmed,
        completed: false
    };
    todos.push(newTodo);
    render();           // 刷新页面显示
    todoInput.value = '';  // 清空输入框
    todoInput.focus();     // 光标回到输入框
}

// ===== 功能 4：筛选 =====
/** 根据 currentFilter 筛选 todos */
function getFilteredTodos() {
    if (currentFilter === 'active') {
        return todos.filter(function (t) { return !t.completed; });
    }
    if (currentFilter === 'completed') {
        return todos.filter(function (t) { return t.completed; });
    }
    return todos;  // 'all' → 返回全部
}

// ===== 渲染函数 =====
/** 根据 todos 数组和当前筛选重新渲染列表 */
function render() {
    // 先更新筛选按钮的高亮状态
    document.querySelectorAll('.filter-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === currentFilter);
    });

    // 更新剩余未完成数量（功能 5）
    const activeCount = todos.filter(function (t) { return !t.completed; }).length;
    counter.textContent = '剩余 ' + activeCount + ' 项';

    const filtered = getFilteredTodos();
    todoList.innerHTML = '';

    // 空状态提示（区分"完全没有"和"筛选后没有"）
    if (todos.length === 0) {
        todoList.innerHTML = '<li class="empty-hint">还没有待办事项，添加一个吧 ✨</li>';
    } else if (filtered.length === 0) {
        todoList.innerHTML = '<li class="empty-hint">没有匹配的事项</li>';
    }

    filtered.forEach(function (todo) {
        const li = document.createElement('li');
        li.className = 'todo-item';
        if (todo.completed) {
            li.classList.add('completed');
        }
        li.innerHTML = `
            <button class="toggle-btn" data-id="${todo.id}">
                ${todo.completed ? '✅' : '⬜'}
            </button>
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <button class="delete-btn" data-id="${todo.id}">🗑</button>
        `;
        todoList.appendChild(li);
    });

    // 每次渲染后自动保存到 localStorage
    saveTodos();
}

/** 转义 HTML 特殊字符，防止 XSS */
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function (char) { return map[char]; });
}

// ===== 事件绑定 =====
// 点击"添加"按钮
addBtn.addEventListener('click', function () {
    addTodo(todoInput.value);
});

// 按回车键也能添加
todoInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        addTodo(todoInput.value);
    }
});

// 筛选按钮：点击切换筛选
document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        currentFilter = btn.getAttribute('data-filter');
        render();
    });
});

// 列表内的事件委托：处理勾选和删除按钮的点击
todoList.addEventListener('click', function (event) {
    const target = event.target;
    const id = target.getAttribute('data-id');
    if (!id) return;

    // 点击的是勾选按钮 → 切换完成状态
    if (target.classList.contains('toggle-btn')) {
        toggleTodo(id);
    }

    // 点击的是删除按钮 → 删除事项
    if (target.classList.contains('delete-btn')) {
        deleteTodo(id);
    }
});

// 「清除已完成」按钮
document.getElementById('clearCompleted').addEventListener('click', function () {
    clearCompleted();
});

// ===== 启动：加载数据 → 首次渲染 =====
loadTodos();
render();
