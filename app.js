/* ==========================================
   待办清单 - 主逻辑
   功能逐步添加，注释按功能区划分
   ========================================== */

// ===== 获取 DOM 元素 =====
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const counter = document.getElementById('counter');
const storageNote = document.querySelector('.storage-note');
const storageMessage = document.getElementById('storageMessage');

// ===== 数据存储（内存 + localStorage） =====
const STORAGE_KEY = 'todo-app-data';

let todos = [];               // 每个 todo: { id, text, completed }
let currentFilter = 'all';    // 当前筛选：'all' | 'active' | 'completed'
let editingId = null;         // 当前正在编辑的事项 ID（null = 无）

// ===== 功能 6：数据持久化 =====
/** 从 localStorage 加载数据 */
function loadTodos() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // 防止数据格式异常导致页面报错
            todos = Array.isArray(parsed) ? parsed.filter(function (todo) {
                return todo && typeof todo.id === 'string'
                    && /^[a-zA-Z0-9_-]{1,64}$/.test(todo.id)
                    && typeof todo.text === 'string'
                    && typeof todo.completed === 'boolean';
            }) : [];
        }
    } catch (e) {
        // 隐私模式或浏览器策略可能禁用本地存储，要让用户知道刷新后无法保留。
        todos = [];
        setStorageWarning('此浏览器不允许读取本地数据，刷新页面后待办可能无法保留。');
    }
}

/** 保存数据到 localStorage */
function saveTodos() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        storageNote.classList.remove('warning');
        storageMessage.textContent = '不会上传服务器，也不会自动同步到其他设备。';
    } catch (e) {
        setStorageWarning('浏览器无法保存数据；刷新或关闭页面后，待办可能丢失。');
    }
}

function setStorageWarning(message) {
    storageNote.classList.add('warning');
    storageMessage.textContent = message;
}

/** 清除所有已完成事项 */
function clearCompleted() {
    cancelEdit();
    todos = todos.filter(function (t) { return !t.completed; });
    render();
}

// ===== 工具函数 =====
/** 生成唯一 ID */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ===== 功能 7：编辑事项 =====
/** 进入编辑模式 */
function startEdit(id) {
    editingId = id;
    render();
    // 渲染完成后聚焦输入框
    setTimeout(function () {
        var editInput = document.querySelector('.edit-input');
        if (editInput) {
            editInput.focus();
            editInput.select();
        }
    }, 0);
}

/** 保存编辑：验证非空 → 更新文字 → 退出编辑 */
function saveEdit(id, newText) {
    var trimmed = newText.trim();
    if (!trimmed) return;  // 空内容不保存，相当于取消
    var todo = todos.find(function (t) { return t.id === id; });
    if (todo) {
        todo.text = trimmed;
    }
    editingId = null;
    render();  // render 里会调用 saveTodos
}

/** 取消编辑 */
function cancelEdit() {
    if (editingId === null) return;  // 不在编辑状态，无需操作
    editingId = null;
    render();
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
        btn.setAttribute('aria-pressed', btn.getAttribute('data-filter') === currentFilter ? 'true' : 'false');
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
        var li = document.createElement('li');
        li.className = 'todo-item';
        if (todo.completed) {
            li.classList.add('completed');
        }

        // 编辑模式：替换为输入框 + 确定/取消按钮
        if (todo.id === editingId) {
            li.classList.add('editing');
            li.innerHTML = ''
                + '<input class="edit-input" type="text" maxlength="100" aria-label="编辑待办事项" value="' + escapeHtml(todo.text) + '" data-id="' + todo.id + '">'
                + '<button class="confirm-btn" type="button" aria-label="保存修改" title="保存" data-id="' + todo.id + '">✓</button>'
                + '<button class="cancel-btn" type="button" aria-label="取消修改" title="取消">×</button>';
        } else {
            li.innerHTML = ''
                + '<button class="toggle-btn" type="button" aria-label="' + (todo.completed ? '标记为未完成' : '标记为已完成') + '" aria-pressed="' + (todo.completed ? 'true' : 'false') + '" data-id="' + todo.id + '">'
                +   (todo.completed ? '✓' : '○')
                + '</button>'
                + '<span class="todo-text">' + escapeHtml(todo.text) + '</span>'
                + '<button class="edit-btn" type="button" aria-label="编辑：' + escapeHtml(todo.text) + '" title="编辑" data-id="' + todo.id + '">✎</button>'
                + '<button class="delete-btn" type="button" aria-label="删除：' + escapeHtml(todo.text) + '" title="删除" data-id="' + todo.id + '">×</button>';
        }

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

// 筛选按钮：点击切换筛选（有编辑状态时先退出）
document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        cancelEdit();
        currentFilter = btn.getAttribute('data-filter');
        render();
    });
});

// 列表内的事件委托：处理所有按钮点击
todoList.addEventListener('click', function (event) {
    var target = event.target;
    var id = target.getAttribute('data-id');

    // 编辑模式下的"取消"按钮（无 data-id）
    if (target.classList.contains('cancel-btn')) {
        cancelEdit();
        return;
    }

    if (!id) return;

    // 勾选按钮
    if (target.classList.contains('toggle-btn')) {
        toggleTodo(id);
    }

    // 删除按钮
    if (target.classList.contains('delete-btn')) {
        deleteTodo(id);
    }

    // 编辑按钮 → 进入编辑模式
    if (target.classList.contains('edit-btn')) {
        startEdit(id);
    }

    // 确定按钮 → 保存编辑
    if (target.classList.contains('confirm-btn')) {
        var editInput = document.querySelector('.edit-input');
        if (editInput) {
            saveEdit(id, editInput.value);
        }
    }
});

// 编辑输入框的键盘事件：回车保存，Esc 取消
todoList.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        var editInput = document.querySelector('.edit-input');
        if (editInput) {
            saveEdit(editInput.getAttribute('data-id'), editInput.value);
        }
    }
    if (event.key === 'Escape') {
        cancelEdit();
    }
});

// 「清除已完成」按钮
document.getElementById('clearCompleted').addEventListener('click', function () {
    clearCompleted();
});

// ===== 启动：加载数据 → 首次渲染 =====
loadTodos();
render();
