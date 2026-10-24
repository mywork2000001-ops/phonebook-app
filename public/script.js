// Вкладки
const tabViewBtn = document.getElementById('tabViewBtn');
const tabManageBtn = document.getElementById('tabManageBtn');
const viewTab = document.getElementById('viewTab');
const manageTab = document.getElementById('manageTab');

// Элементы
const searchInput = document.getElementById('searchInput');
const viewContactsList = document.getElementById('viewContactsList');
const manageContactsList = document.getElementById('manageContactsList');
const contactForm = document.getElementById('contactForm');
const nameInput = document.getElementById('nameInput');
const phoneInput = document.getElementById('phoneInput');

const editSection = document.getElementById('editSection');
const editId = document.getElementById('editId');
const editNameInput = document.getElementById('editNameInput');
const editPhoneInput = document.getElementById('editPhoneInput');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const selectedCountSpan = document.getElementById('selectedCount');

// Синхронизация
const serverIpInput = document.getElementById('serverIpInput');
const uploadBtn = document.getElementById('uploadBtn');
const downloadBtn = document.getElementById('downloadBtn');

let contacts = [];
let selectedContactIds = [];

// Табы
tabViewBtn.addEventListener('click', () => switchTab('view'));
tabManageBtn.addEventListener('click', () => switchTab('manage'));

function switchTab(tab) {
    tabViewBtn.classList.toggle('active', tab === 'view');
    tabManageBtn.classList.toggle('active', tab === 'manage');
    viewTab.classList.toggle('active', tab === 'view');
    manageTab.classList.toggle('active', tab === 'manage');
}

// === АВТОНОМНОЕ ХРАНИЛИЩЕ (LOCALSTORAGE) ===
function getStoredContacts() {
    return JSON.parse(localStorage.getItem('contacts') || '[]');
}

function saveStoredContacts(data) {
    localStorage.setItem('contacts', JSON.stringify(data));
}

function loadContacts() {
    contacts = getStoredContacts();
    renderViewList(contacts);
    renderManageList(contacts);
    selectedContactIds = [];
    updateDeleteButton();
}

// Отрисовка просмотра
function renderViewList(data) {
    viewContactsList.innerHTML = '';
    if (!data.length) return viewContactsList.innerHTML = '<li class="empty">Контактов нет</li>';
    data.forEach(c => {
        const li = document.createElement('li');
        li.innerHTML = `<span><strong>${c.name}</strong>: ${c.phone}</span>`;
        viewContactsList.appendChild(li);
    });
}

// Отрисовка управления
function renderManageList(data) {
    manageContactsList.innerHTML = '';
    if (!data.length) return manageContactsList.innerHTML = '<li class="empty">Контактов нет</li>';

    data.forEach(c => {
        const li = document.createElement('li');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'custom-checkbox';
        checkbox.checked = selectedContactIds.includes(c.id);
        checkbox.addEventListener('change', () => {
            selectedContactIds = checkbox.checked 
                ? [...selectedContactIds, c.id] 
                : selectedContactIds.filter(id => id !== c.id);
            updateDeleteButton();
        });

        const span = document.createElement('span');
        span.innerHTML = `<strong>${c.name}</strong><br><small>${c.phone}</small>`;

        const actions = document.createElement('div');
        actions.className = 'item-actions';

        const editBtn = document.createElement('button');
        editBtn.textContent = '✏️';
        editBtn.className = 'action-btn';
        editBtn.addEventListener('click', () => openEditor(c));

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '❌';
        deleteBtn.className = 'action-btn delete';
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Удалить ${c.name}?`)) {
                contacts = contacts.filter(item => item.id !== c.id);
                saveStoredContacts(contacts);
                loadContacts();
            }
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(actions);
        manageContactsList.appendChild(li);
    });
}

// Добавление (в память телефона)
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    contacts.push({ id: Date.now(), name, phone });
    saveStoredContacts(contacts);
    nameInput.value = '';
    phoneInput.value = '';
    loadContacts();
});

// Редактирование
function openEditor(contact) {
    editId.value = contact.id;
    editNameInput.value = contact.name;
    editPhoneInput.value = contact.phone;
    document.getElementById('createSection').style.display = 'none';
    editSection.style.display = 'block';
}

function closeEditor() {
    editSection.style.display = 'none';
    document.getElementById('createSection').style.display = 'block';
}

cancelEditBtn.addEventListener('click', closeEditor);

saveEditBtn.addEventListener('click', () => {
    const id = Number(editId.value);
    const index = contacts.findIndex(c => c.id === id);
    if (index !== -1) {
        contacts[index] = { id, name: editNameInput.value.trim(), phone: editPhoneInput.value.trim() };
        saveStoredContacts(contacts);
        closeEditor();
        loadContacts();
    }
});

// Массовое удаление
function updateDeleteButton() {
    selectedCountSpan.textContent = selectedContactIds.length;
    deleteSelectedBtn.style.display = selectedContactIds.length > 0 ? 'block' : 'none';
}

deleteSelectedBtn.addEventListener('click', () => {
    if (confirm(`Удалить выбранные контакты (${selectedContactIds.length})?`)) {
        contacts = contacts.filter(c => !selectedContactIds.includes(c.id));
        saveStoredContacts(contacts);
        loadContacts();
    }
});

// Поиск
searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    renderViewList(contacts.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)));
});

// === СИНХРОНИЗАЦИЯ С BACKEND (ПК) ===
// Сохраняем IP в памяти, чтобы не вводить каждый раз
serverIpInput.value = localStorage.getItem('server_ip') || '';

serverIpInput.addEventListener('change', () => {
    localStorage.setItem('server_ip', serverIpInput.value.trim());
});

// 1. Отправить контакты на сервер в contacts.json
uploadBtn.addEventListener('click', async () => {
    const ip = serverIpInput.value.trim();
    if (!ip) return alert('Введите адрес сервера (например: 192.168.1.5:8080)');

    try {
        const res = await fetch(`http://${ip}/api/contacts/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contacts)
        });
        if (res.ok) alert('✅ Все контакты успешно сохранены в contacts.json на сервере!');
        else alert('Ошибка сохранения на сервере');
    } catch (err) {
        alert('Не удалось подключиться к серверу: ' + err.message);
    }
});

// 2. Скачать контакты из contacts.json в телефон
downloadBtn.addEventListener('click', async () => {
    const ip = serverIpInput.value.trim();
    if (!ip) return alert('Введите адрес сервера (например: 192.168.1.5:8080)');

    try {
        const res = await fetch(`http://${ip}/api/contacts`);
        const serverContacts = await res.json();
        contacts = serverContacts;
        saveStoredContacts(contacts);
        loadContacts();
        alert('✅ Контакты успешно загружены с сервера в телефон!');
    } catch (err) {
        alert('Не удалось подключиться к серверу: ' + err.message);
    }
});

// Старт
loadContacts();