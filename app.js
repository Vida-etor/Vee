// Shared client-side logic for Member, Payment, and Dashboard pages
// Persistence via localStorage

(function () {
    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function saveToStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function loadFromStorage(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function onReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function initMobileMenu() {
        const toggle = $('.mobile-menu-toggle');
        const sidebar = $('.sidebar');
        if (!toggle || !sidebar) return;
        toggle.addEventListener('click', function () {
            sidebar.classList.toggle('open');
        });
    }

    // MEMBER PAGE
    function initMemberPage() {
        const form = document.querySelector('.profile-form form');
        if (!form) return;

        const fields = [
            'first-name', 'last-name', 'date-of-birth', 'email', 'phone', 'address',
            'city', 'state', 'zip-code', 'country', 'description', 'occupation',
            'interests', 'emergency-contact', 'emergency-phone'
        ];

        function loadProfile() {
            const profile = loadFromStorage('profile', null);
            if (!profile) return;
            fields.forEach(function (id) {
                const el = document.getElementById(id);
                if (!el) return;
                if (el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = profile[id] || '';
                }
            });
        }

        function collectProfile() {
            const profile = {};
            fields.forEach(function (id) {
                const el = document.getElementById(id);
                if (!el) return;
                profile[id] = el.value || '';
            });
            return profile;
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const data = collectProfile();
            saveToStorage('profile', data);
            alert('Profile saved');
        });

        const resetBtn = document.getElementById('profile-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                form.reset();
                localStorage.removeItem('profile');
            });
        }

        loadProfile();
    }

    // PAYMENT PAGE
    function initPaymentPage() {
        const form = document.querySelector('.payment-form form');
        if (!form) return;

        const fieldIds = [
            'amount', 'reference', 'payment-method', 'payment-type', 'description',
            'currency', 'payment-date', 'billing-address', 'notes', 'save-payment-method', 'terms-agreement'
        ];

        function collectPayment() {
            const data = {};
            fieldIds.forEach(function (id) {
                const el = document.getElementById(id);
                if (!el) return;
                if (el.type === 'checkbox') {
                    data[id] = el.checked;
                } else {
                    data[id] = el.value || '';
                }
            });
            return data;
        }

        function fillPayment(data) {
            fieldIds.forEach(function (id) {
                const el = document.getElementById(id);
                if (!el) return;
                if (el.type === 'checkbox') {
                    el.checked = !!data[id];
                } else {
                    el.value = data[id] || '';
                }
            });
        }

        function renderPayments() {
            const historyEl = document.getElementById('payment-history-list');
            if (!historyEl) return;
            const payments = loadFromStorage('payments', []);
            historyEl.innerHTML = '';
            payments.forEach(function (p) {
                const div = document.createElement('div');
                div.className = 'payment-item';
                div.innerHTML =
                    '<div class="payment-header">' +
                    '<span class="payment-amount">' + (p.currency === 'GHC' || p.currency === 'GHC' ? '₵' : '') + String(p.amount) + '</span>' +
                    '<span class="payment-status ' + (p.status === 'Completed' ? 'completed' : 'pending') + '">' + p.status + '</span>' +
                    '</div>' +
                    '<div class="payment-details">' +
                    '<p><strong>Reference:</strong> ' + p.reference + '</p>' +
                    '<p><strong>Method:</strong> ' + p.paymentMethod + '</p>' +
                    '<p><strong>Date:</strong> ' + p.date + '</p>' +
                    '<p><strong>Description:</strong> ' + (p.description || '') + '</p>' +
                    '</div>';
                historyEl.appendChild(div);
            });
        }

        // Process Payment
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const data = collectPayment();
            const payments = loadFromStorage('payments', []);
            payments.unshift({
                amount: Number(data.amount || 0).toFixed(2),
                reference: data.reference || '',
                paymentMethod: data['payment-method'] || '',
                paymentType: data['payment-type'] || '',
                description: data.description || '',
                currency: data.currency || 'USD',
                date: data['payment-date'] || new Date().toISOString().slice(0, 10),
                billingAddress: data['billing-address'] || '',
                notes: data.notes || '',
                savedMethod: !!data['save-payment-method'],
                status: data['terms-agreement'] ? 'Completed' : 'Pending'
            });
            saveToStorage('payments', payments);
            localStorage.removeItem('paymentDraft');
            alert('Payment recorded');
            form.reset();
            renderPayments();
        });

        // Save as Draft
        const draftBtn = document.getElementById('save-payment-draft');
        if (draftBtn) {
            draftBtn.addEventListener('click', function () {
                const data = collectPayment();
                saveToStorage('paymentDraft', data);
                alert('Payment draft saved');
            });
        }

        // Load Draft if exists
        const draft = loadFromStorage('paymentDraft', null);
        if (draft) fillPayment(draft);

        renderPayments();
    }

    // DASHBOARD PAGE (Todos)
    function initDashboardPage() {
        const form = document.querySelector('.todo-form form');
        const listContainer = document.getElementById('todos-container');
        if (!form || !listContainer) return;

        function loadTodos() {
            return loadFromStorage('todos', []);
        }

        function saveTodos(todos) {
            saveToStorage('todos', todos);
        }

        function renderTodos() {
            const todos = loadTodos();
            listContainer.innerHTML = '';
            todos.forEach(function (t) {
                const item = document.createElement('div');
                item.className = 'todo-item';
                item.dataset.id = String(t.id);
                const priorityClass = t.priority === 'high' ? 'high' : t.priority === 'medium' ? 'medium' : 'low';
                item.innerHTML =
                    '<div class="todo-header">' +
                    '<h4' + (t.completed ? ' style="text-decoration: line-through; color: #888;"' : '') + '>' + escapeHtml(t.title) + '</h4>' +
                    '<span class="priority ' + priorityClass + '">' +
                    (t.priority === 'high' ? 'High Priority' : t.priority === 'medium' ? 'Medium Priority' : 'Low Priority') +
                    '</span>' +
                    '</div>' +
                    '<p class="todo-description">' + escapeHtml(t.description || '') + '</p>' +
                    '<div class="todo-meta">' +
                    '<span class="due-date">' + (t.dueDate ? 'Due: ' + t.dueDate : '') + '</span>' +
                    '<div class="todo-actions">' +
                    '<button class="btn btn-small btn-success" data-action="complete">' + (t.completed ? 'Undo' : 'Complete') + '</button>' +
                    '<button class="btn btn-small btn-danger" data-action="delete">Delete</button>' +
                    '</div>' +
                    '</div>';
                listContainer.appendChild(item);
            });
        }

        function escapeHtml(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const title = document.getElementById('todo-title').value.trim();
            if (!title) return;
            const description = document.getElementById('todo-description').value.trim();
            const priority = document.getElementById('todo-priority').value || 'low';
            const dueDate = document.getElementById('todo-due-date').value || '';

            const todos = loadFromStorage('todos', []);
            const newTodo = {
                id: Date.now(),
                title: title,
                description: description,
                priority: priority,
                dueDate: dueDate,
                completed: false
            };
            todos.unshift(newTodo);
            saveToStorage('todos', todos);
            form.reset();
            renderTodos();
        });

        // Event delegation for complete/delete
        listContainer.addEventListener('click', function (e) {
            const target = e.target;
            if (!(target instanceof Element)) return;
            const action = target.getAttribute('data-action');
            if (!action) return;
            const parent = target.closest('.todo-item');
            if (!parent) return;
            const id = Number(parent.dataset.id);
            const todos = loadFromStorage('todos', []);
            const idx = todos.findIndex(function (t) { return t.id === id; });
            if (idx === -1) return;
            if (action === 'delete') {
                todos.splice(idx, 1);
            } else if (action === 'complete') {
                todos[idx].completed = !todos[idx].completed;
            }
            saveToStorage('todos', todos);
            renderTodos();
        });

        renderTodos();
    }

    onReady(function () {
        initMobileMenu();
        initMemberPage();
        initPaymentPage();
        initDashboardPage();
    });
})();


