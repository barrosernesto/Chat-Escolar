const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Servir arquivos frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rota para testar
app.get('/test', (req, res) => {
    res.json({ message: 'Servidor está funcionando!' });
});

// Banco de dados
const db = new sqlite3.Database('./chat.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite!');
        createTables();
    }
});

function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            socket_id TEXT,
            online INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Erro na tabela users:', err);
        else console.log('✅ Tabela users criada/verificada');
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT,
            receiver TEXT,
            message TEXT,
            is_private INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Erro na tabela messages:', err);
        else console.log('✅ Tabela messages criada/verificada');
    });
}

const onlineUsers = new Map();

// Socket.IO
io.on('connection', (socket) => {
    console.log('🔗 Novo usuário conectado:', socket.id);

    // Evento: Usuário entra no chat
    socket.on('user_join', (username) => {
        if (!username || username.trim() === '') return;

        username = username.trim();
        console.log(`👤 Usuário entrou: ${username} (socket: ${socket.id})`);
        onlineUsers.set(socket.id, username);
        socket.username = username;

        // Atualizar/Inserir usuário no banco
        db.run(`
            INSERT OR REPLACE INTO users (username, socket_id, online) 
            VALUES (?, ?, 1)
        `, [username, socket.id], (err) => {
            if (err) console.error('Erro ao salvar usuário:', err);
        });

        // Notificar todos sobre novo usuário online
        const usersArray = Array.from(onlineUsers.values());
        console.log(`👥 Usuários online: ${usersArray.join(', ')}`);
        
        io.emit('users_online', usersArray);
        io.emit('user_joined', { username, onlineUsers: usersArray });

        // Enviar histórico de mensagens gerais para o novo usuário
        db.all(`
            SELECT sender, receiver, message, is_private, created_at 
            FROM messages 
            WHERE is_private = 0 
            ORDER BY created_at ASC 
            LIMIT 50
        `, [], (err, rows) => {
            if (!err && rows && rows.length > 0) {
                socket.emit('message_history', { messages: rows });
            }
        });
    });

    // Evento: Carregar histórico de mensagens
    socket.on('load_message_history', (data) => {
        const username = socket.username;
        
        if (!data.isPrivate) {
            // Histórico público
            db.all(`
                SELECT sender, receiver, message, is_private, created_at 
                FROM messages 
                WHERE is_private = 0 
                ORDER BY created_at ASC 
                LIMIT 50
            `, [], (err, rows) => {
                if (!err && rows) {
                    socket.emit('message_history', { messages: rows });
                }
            });
        } else if (data.withUser) {
            // Histórico privado com um usuário específico
            db.all(`
                SELECT sender, receiver, message, is_private, created_at 
                FROM messages 
                WHERE is_private = 1 
                AND (
                    (sender = ? AND receiver = ?) 
                    OR (sender = ? AND receiver = ?)
                )
                ORDER BY created_at ASC 
                LIMIT 50
            `, [username, data.withUser, data.withUser, username], (err, rows) => {
                if (!err && rows) {
                    socket.emit('message_history', { messages: rows });
                }
            });
        }
    });

    // Evento: Mensagem pública
    socket.on('send_message', (data) => {
        const username = socket.username;
        const message = data.message;

        if (!username || !message) {
            console.log('Mensagem inválida:', { username, message });
            return;
        }

        console.log(`💬 Mensagem pública de ${username}: ${message}`);

        const messageData = {
            sender: username,
            message: message,
            timestamp: new Date().toISOString(),
            isPrivate: false
        };

        // Salvar no banco
        db.run(`
            INSERT INTO messages (sender, receiver, message, is_private)
            VALUES (?, ?, ?, ?)
        `, [username, 'all', message, 0], (err) => {
            if (err) console.error('Erro ao salvar mensagem:', err);
        });

        // Enviar para todos
        io.emit('receive_message', messageData);
    });

    // Evento: Mensagem privada
    socket.on('send_private_message', (data) => {
        const sender = socket.username;
        const receiver = data.receiver;
        const message = data.message;

        if (!sender || !receiver || !message) {
            console.log('Mensagem privada inválida:', { sender, receiver, message });
            return;
        }

        // Encontrar socket do destinatário
        let recipientSocketId = null;
        for (let [sId, uname] of onlineUsers.entries()) {
            if (uname === receiver) {
                recipientSocketId = sId;
                break;
            }
        }

        const messageData = {
            sender: sender,
            receiver: receiver,
            message: message,
            timestamp: new Date().toISOString(),
            isPrivate: true
        };

        // Salvar no banco
        db.run(`
            INSERT INTO messages (sender, receiver, message, is_private)
            VALUES (?, ?, ?, ?)
        `, [sender, receiver, message, 1], (err) => {
            if (err) console.error('Erro ao salvar mensagem privada:', err);
        });

        if (recipientSocketId) {
            // Se o destinatário for o mesmo socket do remetente, enviar apenas uma vez
            if (recipientSocketId === socket.id) {
                socket.emit('receive_private_message', messageData);
            } else {
                // Enviar para o destinatário
                io.to(recipientSocketId).emit('receive_private_message', messageData);
                // Confirmação para o remetente
                socket.emit('receive_private_message', messageData);
            }
            console.log(`🔒 Mensagem privada de ${sender} para ${receiver}`);
        } else {
            console.log(`❌ Usuário ${receiver} não encontrado online`);
            socket.emit('error_message', { error: `Usuário ${receiver} não está online` });
        }
    });

    // Evento: Usuário está digitando
    socket.on('typing', (username) => {
        if (!username) return;
        
        socket.broadcast.emit('user_typing', {
            username: username,
            isTyping: true
        });
    });

    // Evento: Usuário parou de digitar
    socket.on('stop_typing', (username) => {
        if (!username) return;
        
        socket.broadcast.emit('user_typing', {
            username: username,
            isTyping: false
        });
    });

    // Evento: Desconexão
    socket.on('disconnect', () => {
        const username = onlineUsers.get(socket.id);
        
        if (username) {
            onlineUsers.delete(socket.id);
            console.log(`👋 ${username} desconectou`);
            
            // Atualizar status no banco
            db.run(`UPDATE users SET online = 0 WHERE socket_id = ?`, [socket.id], (err) => {
                if (err) console.error('Erro ao atualizar status:', err);
            });
            
            // Notificar todos
            const usersArray = Array.from(onlineUsers.values());
            io.emit('users_online', usersArray);
            io.emit('user_left', { username, onlineUsers: usersArray });
        }
    });
});

// API para status
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online',
        usersOnline: onlineUsers.size,
        message: 'Chat ISPPU - Sistemas Distribuídos'
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
    console.log('📡 Socket.IO está pronto para conexões');
    console.log('='.repeat(50));
});