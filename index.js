const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatSchema = new mongoose.Schema({
    idChat: { type: String, required: true, unique: true },
    title: { type: String, default: 'Chat Baru' },
    history: { type: Array, default: [] },
    timestamp: { type: Date, default: Date.now },
});
const Chat = mongoose.model('Chat', chatSchema);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    chats: [{ type: String, ref: 'Chat' }]
});
const User = mongoose.model('User', userSchema);

mongoose.connect('mongodb+srv://UAPJayaJayaJaya:Y98y8p55XNwRM9hO@uap.shf5z.mongodb.net/chat_db')
    .then(() => console.log('Database connected!'))
    .catch(err => console.error(err));

app.post('/api/chat', async (req, res) => {
    const { idChat, question, username, title } = req.body;

    if (!idChat || !question || !username) {
        return res.status(400).send({ error: 'idChat, question, dan username diperlukan.' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).send({ error: 'User tidak ditemukan.' });
        }

        let chatData = await Chat.findOne({ idChat });

        let chat;
        if (!chatData) {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            chat = model.startChat();
            const initialTitle = title || question.substring(0, 50) + '...';
            chatData = new Chat({
                idChat,
                history: [],
                title: initialTitle
            });
        } else {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            chat = model.startChat({
                history: chatData.history,
            });
        }

        const result = await chat.sendMessage(question);

        const responseText = result.response.text();
        chatData.history.push(
            { role: 'user', parts: [{ text: question }] },
            { role: 'model', parts: [{ text: responseText }] }
        );

        await chatData.save();

        if (!user.chats.includes(idChat)) {
            user.chats.push(idChat);
            await user.save();
        }

        res.send({ idChat, response: responseText });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ error: 'Username dan password diperlukan.' });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send({ error: 'Username sudah digunakan.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            password: hashedPassword
        });

        await user.save();
        res.status(201).send({ message: 'Registrasi berhasil' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.get('/api/user/chats/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).send({ error: 'User tidak ditemukan.' });
        }

        const chats = await Chat.find({ idChat: { $in: user.chats } });
        res.send(chats);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ error: 'Username dan password diperlukan.' });
    }

    try {
        // Cari user berdasarkan username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).send({ error: 'Username atau password salah.' });
        }

        // Verifikasi password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send({ error: 'Username atau password salah.' });
        }

        res.send({
            message: 'Login berhasil',
            username: user.username
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.put('/api/chat/title', async (req, res) => {
    const { idChat, title, username } = req.body;

    if (!idChat || !title || !username) {
        return res.status(400).send({ error: 'idChat, title, dan username diperlukan.' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).send({ error: 'User tidak ditemukan.' });
        }

        if (!user.chats.includes(idChat)) {
            return res.status(403).send({ error: 'Akses ditolak.' });
        }

        const chatData = await Chat.findOne({ idChat });
        if (!chatData) {
            return res.status(404).send({ error: 'Chat tidak ditemukan.' });
        }

        chatData.title = title;
        await chatData.save();

        res.send({
            message: 'Title berhasil diupdate',
            idChat,
            title
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.delete('/api/chat/:idChat', async (req, res) => {
    const { idChat } = req.params;
    const { username } = req.body;

    if (!idChat || !username) {
        return res.status(400).send({ error: 'idChat dan username diperlukan.' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).send({ error: 'User tidak ditemukan.' });
        }

        if (!user.chats.includes(idChat)) {
            return res.status(403).send({ error: 'Akses ditolak.' });
        }

        const deletedChat = await Chat.findOneAndDelete({ idChat });
        if (!deletedChat) {
            return res.status(404).send({ error: 'Chat tidak ditemukan.' });
        }

        user.chats = user.chats.filter(chatId => chatId !== idChat);
        await user.save();

        res.send({
            message: 'Chat berhasil dihapus',
            idChat
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});