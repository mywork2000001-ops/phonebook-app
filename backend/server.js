const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

// Указываем точный путь к файлу базы данных внутри папки backend
const DATA_FILE = path.join(__dirname, 'contacts.json');

// Включаем поддержку чтения JSON-данных от пользователя
app.use(express.json());

// Связываем сервер с папкой фронтенда public (она находится на один уровень выше, поэтому пишем '..')
app.use(express.static(path.join(__dirname, '..', 'public')));

// 1. Получить все контакты из базы данных (Read)
app.get('/api/contacts', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Ошибка чтения файла' });
        res.json(JSON.parse(data));
    });
});

// 2. Добавить новый контакт в базу данных (Create)
app.post('/api/contacts', (req, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Имя и телефон обязательны' });

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Ошибка чтения файла' });
        
        const contacts = JSON.parse(data);
        const newContact = { id: Date.now(), name, phone }; // создаем контакт с уникальным id
        contacts.push(newContact);

        fs.writeFile(DATA_FILE, JSON.stringify(contacts, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Ошибка записи файла' });
            res.status(201).json(newContact);
        });
    });
});

// 3. МАССОВОЕ УДАЛЕНИЕ: Удалить несколько выбранных контактов
app.post('/api/contacts/delete-multiple', (req, res) => {
    const { ids } = req.body; // Получаем массив ID от фронтенда
    
    if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: 'Не передан массив идентификаторов' });
    }

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Ошибка чтения базы данных' });
        
        const contacts = JSON.parse(data);
        
        // Оставляем только те контакты, чьих ID НЕТ в списке удаляемых (ids)
        const updatedContacts = contacts.filter(c => !ids.includes(c.id));

        fs.writeFile(DATA_FILE, JSON.stringify(updatedContacts, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Ошибка записи в базу данных' });
            res.json({ message: 'Выбранные контакты успешно удалены' });
        });
    });
});

// 4. ОДИНОЧНОЕ УДАЛЕНИЕ: Удалить контакт по его ID (Delete)
app.delete('/api/contacts/:id', (req, res) => {
    const contactId = parseInt(req.params.id); // Получаем ID из адреса запроса

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Ошибка чтения файла' });
        
        const contacts = JSON.parse(data);
        // Фильтруем массив: оставляем только те контакты, чей ID не совпадает с удаляемым
        const updatedContacts = contacts.filter(c => c.id !== contactId);

        fs.writeFile(DATA_FILE, JSON.stringify(updatedContacts, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Ошибка записи файла' });
            res.json({ message: 'Контакт успешно удален' });
        });
    });
});
// ==========================================
// ОТДЕЛЬНЫЙ БЛОК: РЕДАКТИРОВАНИЕ КОНТАКТА (PUT)
// ==========================================
app.put('/api/contacts/:id', (req, res) => {
    const contactId = parseInt(req.params.id); // Получаем ID редактируемого контакта
    const { name, phone } = req.body; // Получаем новые имя и телефон

    if (!name || !phone) return res.status(400).json({ error: 'Имя и телефон обязательны' });

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Ошибка чтения базы данных' });
        
        let contacts = JSON.parse(data);
        // Находим контакт в массиве по ID
        const contactIndex = contacts.findIndex(c => c.id === contactId);

        if (contactIndex === -1) return res.status(404).json({ error: 'Контакт не найден' });

        // Обновляем данные контакта
        contacts[contactIndex] = { id: contactId, name: name.trim(), phone: phone.trim() };

        fs.writeFile(DATA_FILE, JSON.stringify(contacts, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Ошибка записи в базу данных' });
            res.json(contacts[contactIndex]); // Возвращаем обновленный контакт
        });
    });
});
// Эндпоинт для полной синхронизации базы из APK
app.post('/api/contacts/sync', (req, res) => {
    const newContacts = req.body;
    if (!Array.isArray(newContacts)) {
        return res.status(400).json({ error: 'Ожидается массив контактов' });
    }
    fs.writeFile(DATA_FILE, JSON.stringify(newContacts, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка сохранения' });
        res.json({ message: 'База успешно синхронизирована!' });
    });
});
// ФИНАЛ: Запуск сервера на порту 8080 (строго в самом конце файла!)

app.listen(PORT, () => {
    console.log(`Сервер успешно запущен на http://localhost:${PORT}`);
});
