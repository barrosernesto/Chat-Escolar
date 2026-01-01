// app.js
document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const loginScreen = document.getElementById('login-screen');
    const chatContainer = document.getElementById('chat-container');
    const usernameInput = document.getElementById('username');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const currentUserSpan = document.getElementById('current-user');
    const onlineCount = document.getElementById('online-count');
    const onlineUsersList = document.getElementById('online-users');
    const typingIndicator = document.getElementById('typing-indicator');
    const typingUserSpan = document.getElementById('typing-user');
    const tabAll = document.getElementById('tab-all');
    const tabPrivate = document.getElementById('tab-private');
    const chatAll = document.getElementById('chat-all');
    const chatPrivate = document.getElementById('chat-private');
    const messagesAll = document.getElementById('messages-all');
    const messagesPrivate = document.getElementById('messages-private');
    const messageInputAll = document.getElementById('message-input-all');
    const messageInputPrivate = document.getElementById('message-input-private');
    const sendAllBtn = document.getElementById('send-all');
    const sendPrivateBtn = document.getElementById('send-private');
    const privateWithSpan = document.querySelector('#private-with span');
    const closePrivateBtn = document.getElementById('close-private');
    const notifications = document.getElementById('notifications');
    
    // Variáveis do aplicativo
    let socket;
    let currentUser = '';
    let selectedUser = null;
    let typingTimeout;
    let usersOnline = [];
    let typingDebounceTimer = null;
    let lastTypingTime = 0;
    
    // Função para debounce de digitação (otimização)
    function debounceTyping() {
        const now = Date.now();
        
        if (now - lastTypingTime > 500) {
            lastTypingTime = now;
            socket.emit('typing', currentUser);
            
            clearTimeout(typingDebounceTimer);
            typingDebounceTimer = setTimeout(() => {
                socket.emit('stop_typing', currentUser);
                lastTypingTime = 0;
            }, 1500);
        }
    }
    
    // Inicializar Socket.IO
    function initSocket() {
        socket = io();
        
        // Evento: Conexão estabelecida
        socket.on('connect', () => {
            console.log('Conectado ao servidor');
        });
        
        // Evento: Receber lista de usuários online
        socket.on('users_online', (users) => {
            usersOnline = users;
            updateOnlineUsers();
        });
        socket.on('user_joined', (data) => {
            usersOnline = data.onlineUsers;
            updateOnlineUsers();
            
            // Adicionar mensagem de entrada
            if (data.username !== currentUser) {
                addSystemMessage(`${data.username} entrou no chat`, 'all');
            }
        });
        
        // Evento: Usuário saiu
        socket.on('user_left', (data) => {
            usersOnline = data.onlineUsers;
            updateOnlineUsers();
            
            // Se o usuário selecionado saiu, fechar chat privado
            if (selectedUser && !usersOnline.includes(selectedUser)) {
                resetPrivateChat();
            }
            
            addSystemMessage(`${data.username} saiu do chat`, 'all');
        });
        
        // Evento: Receber mensagem
        socket.on('receive_message', (data) => {
            addMessage(data, false, 'all');
        });
        
        // Evento: Receber mensagem privada
        socket.on('receive_private_message', (data) => {
            addMessage(data, true, 'private');
            
            // Mostrar notificação
            if (data.sender !== currentUser) {
                showNotification(`Mensagem privada de ${data.sender}`, 'private');
            }
            
            // Se não estiver na aba privada, avisar
            if (!chatPrivate.classList.contains('active')) {
                showNotification(`Nova mensagem de ${data.sender}`, 'private');
            }
        });
        
        // Evento: Usuário está digitando
        socket.on('user_typing', (data) => {
            if (data.username !== currentUser) {
                if (data.isTyping) {
                    typingUserSpan.textContent = data.username;
                    typingIndicator.classList.remove('hidden');
                } else {
                    typingIndicator.classList.add('hidden');
                }
            }
        });
        
        // Evento: Histórico de mensagens
        socket.on('message_history', (data) => {
            displayMessageHistory(data.messages);
        });
    }
    
    // Função para entrar no chat
    function login() {
        const username = usernameInput.value.trim();
        
        if (!username) {
            alert('Por favor, digite um nome de usuário');
            return;
        }
        
        if (username.length < 2) {
            alert('O nome de usuário deve ter pelo menos 2 caracteres');
            return;
        }
        
        currentUser = username;
        currentUserSpan.textContent = username;
        
        // Conectar ao socket e entrar no chat
        initSocket();
        socket.emit('user_join', username);
        
        // Alternar telas
        loginScreen.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        
        // Ativar input de mensagem
        messageInputAll.disabled = false;
        messageInputAll.focus();
        
        // Carregar histórico
        socket.emit('load_message_history', { isPrivate: false });
        
        // Adicionar mensagem de boas-vindas
        addSystemMessage(`Bem-vindo(a), ${username}!`, 'all');
    }
    
    // Função para sair do chat
    function logout() {
        if (confirm('Tem certeza que deseja sair do chat?')) {
            socket.disconnect();
            
            // Resetar interface
            chatContainer.classList.add('hidden');
            loginScreen.classList.remove('hidden');
            usernameInput.value = '';
            currentUser = '';
            selectedUser = null;
            
            // Limpar mensagens
            messagesAll.innerHTML = '';
            messagesPrivate.innerHTML = '';
            
            // Limpar usuários online
            onlineUsersList.innerHTML = '';
            onlineCount.textContent = '0';
            
            // Resetar chat privado
            resetPrivateChat();
        }
    }
    
    // Função para atualizar lista de usuários online (otimizado)
    function updateOnlineUsers() {
        onlineCount.textContent = usersOnline.length;
        
        // Usar fragment para evitar refluxo do DOM
        const fragment = document.createDocumentFragment();
        
        // Ordenar usuários (usuário atual primeiro)
        const sortedUsers = [...usersOnline].sort((a, b) => {
            if (a === currentUser) return -1;
            if (b === currentUser) return 1;
            return a.localeCompare(b);
        });
        
        sortedUsers.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            if (user === selectedUser) {
                userItem.classList.add('selected');
            }
            
            // Criar avatar com iniciais
            const initials = user.substring(0, 2).toUpperCase();
            
            userItem.innerHTML = `
                <div class="user-avatar">${initials}</div>
                <div class="user-info">
                    <div class="user-name">${user} ${user === currentUser ? '(Você)' : ''}</div>
                </div>
            `;
            
            // Adicionar evento de clique
            if (user !== currentUser) {
                userItem.addEventListener('click', () => {
                    selectUserForPrivateChat(user);
                });
            } else {
                userItem.style.opacity = '0.7';
            }
            
            fragment.appendChild(userItem);
        });
        
        onlineUsersList.innerHTML = '';
        onlineUsersList.appendChild(fragment);
    }
    
    // Função para selecionar usuário para chat privado
    function selectUserForPrivateChat(username) {
        selectedUser = username;
        privateWithSpan.textContent = username;
        
        // Ativar aba privada
        tabPrivate.click();
        
        // Ativar input
        messageInputPrivate.disabled = false;
        messageInputPrivate.focus();
        sendPrivateBtn.disabled = false;
        
        // Atualizar seleção visual
        document.querySelectorAll('.user-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Encontrar e selecionar o item do usuário
        document.querySelectorAll('.user-item').forEach(item => {
            if (item.querySelector('.user-name').textContent.includes(username)) {
                item.classList.add('selected');
            }
        });
        
        // Carregar histórico de mensagens privadas
        socket.emit('load_message_history', { 
            isPrivate: true, 
            withUser: username 
        });
    }
    
    // Função para resetar chat privado
    function resetPrivateChat() {
        selectedUser = null;
        privateWithSpan.textContent = 'Nenhum usuário selecionado';
        messagesPrivate.innerHTML = '';
        messageInputPrivate.value = '';
        messageInputPrivate.disabled = true;
        sendPrivateBtn.disabled = true;
        
        // Remover seleção visual
        document.querySelectorAll('.user-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Voltar para aba geral
        tabAll.click();
    }
    
    // Função para enviar mensagem
    function sendMessage(isPrivate = false) {
        let messageInput, receiver;
        
        if (isPrivate) {
            if (!selectedUser) {
                alert('Selecione um usuário para enviar mensagem privada');
                return;
            }
            messageInput = messageInputPrivate;
            receiver = selectedUser;
        } else {
            messageInput = messageInputAll;
        }
        
        const message = messageInput.value.trim();
        if (!message) return;
        
        if (isPrivate) {
            socket.emit('send_private_message', {
                receiver: receiver,
                message: message
            });

            // A mensagem privada será adicionada quando o servidor enviar 'receive_private_message'
            // para evitar duplicação (o servidor emite para remetente e destinatário).
        } else {
            socket.emit('send_message', {
                message: message
            });
            
            // Adicionar mensagem localmente
            addMessage({
                sender: currentUser,
                message: message,
                timestamp: new Date().toISOString(),
                isPrivate: false
            }, false, 'all');
        }
        
        // Limpar input
        messageInput.value = '';
        
        // Notificar que parou de digitar
        socket.emit('stop_typing', currentUser);
    }
    
    // Função para adicionar mensagem (otimizado)
    function addMessage(data, isPrivate, type) {
        const messagesContainer = type === 'all' ? messagesAll : messagesPrivate;
        
        // Remover placeholder se existir
        const placeholder = messagesContainer.querySelector('.no-messages');
        if (placeholder) {
            placeholder.remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        
        const isOwnMessage = data.sender === currentUser;
        
        if (isOwnMessage) {
            messageElement.classList.add('own');
        } else {
            messageElement.classList.add('other');
        }
        
        if (isPrivate) {
            messageElement.classList.add('private');
        }
        
        // Formatar hora (aceita diferentes campos do servidor/histórico)
        const rawTs = data.timestamp || data.created_at || data.createdAt || data.createdAt || new Date().toISOString();
        let time = new Date(rawTs);
        if (isNaN(time.getTime())) time = new Date();
        const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Criar conteúdo sem usar innerHTML (mais seguro)
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';

        const senderDiv = document.createElement('div');
        senderDiv.className = 'sender';
        if (isPrivate) {
            const lockIcon = document.createElement('i');
            lockIcon.className = 'fas fa-lock';
            lockIcon.title = 'Privado';
            lockIcon.setAttribute('aria-hidden', 'true');
            senderDiv.appendChild(lockIcon);
            const nameSpan = document.createElement('span');
            nameSpan.style.marginLeft = '6px';
            nameSpan.textContent = data.sender || '';
            senderDiv.appendChild(nameSpan);
        } else {
            senderDiv.textContent = data.sender || '';
        }

        const timeDiv = document.createElement('div');
        timeDiv.className = 'time';
        timeDiv.textContent = timeString;
        
        headerDiv.appendChild(senderDiv);
        headerDiv.appendChild(timeDiv);
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = data.message;
        
        messageElement.appendChild(headerDiv);
        messageElement.appendChild(textDiv);
        
        messagesContainer.appendChild(messageElement);
        
        // Scroll suave para o final
        requestAnimationFrame(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    }
    
    // Função para adicionar mensagem do sistema
    function addSystemMessage(text, type) {
        const messagesContainer = type === 'all' ? messagesAll : messagesPrivate;
        
        const systemMessage = document.createElement('div');
        systemMessage.className = 'message system';
        systemMessage.style.textAlign = 'center';
        systemMessage.style.color = '#666';
        systemMessage.style.fontSize = '14px';
        systemMessage.style.fontStyle = 'italic';
        systemMessage.style.margin = '10px 0';
        systemMessage.textContent = text;
        
        messagesContainer.appendChild(systemMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Função para exibir histórico
    function displayMessageHistory(messages) {
        messagesAll.innerHTML = '';
        messagesPrivate.innerHTML = '';
        
        if (messages.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'no-messages';
            placeholder.style.textAlign = 'center';
            placeholder.style.color = '#999';
            placeholder.style.padding = '40px 20px';
            placeholder.innerHTML = '<i class="fas fa-comment-slash" style="font-size: 48px; margin-bottom: 20px;"></i><p>Nenhuma mensagem ainda</p>';
            messagesAll.appendChild(placeholder);
            return;
        }
        
        messages.forEach(msg => {
            const isPrivate = msg.is_private === 1 || msg.isPrivate === 1 || msg.is_private === true;
            const ts = msg.timestamp || msg.created_at || msg.createdAt || msg.created_at;

            addMessage({
                sender: msg.sender,
                receiver: msg.receiver,
                message: msg.message,
                timestamp: ts,
                isPrivate: isPrivate
            }, isPrivate, isPrivate ? 'private' : 'all');
        });
    }
    
    // Função para detectar digitação
    function handleTyping(isPrivate = false) {
        if (!isPrivate || selectedUser) {
            debounceTyping();
        }
    }
    
    // Função para mostrar notificação
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'private' ? 'user-secret' : 'info-circle'}"></i>
            ${message}
        `;
        
        notifications.appendChild(notification);
        
        // Remover após 5 segundos
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    // Inicializar eventos
    function initEvents() {
        // Login
        loginBtn.addEventListener('click', login);
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });
        
        // Logout
        logoutBtn.addEventListener('click', logout);
        
        // Alternar abas
        tabAll.addEventListener('click', () => {
            tabAll.classList.add('active');
            tabPrivate.classList.remove('active');
            chatAll.classList.add('active');
            chatPrivate.classList.remove('active');
            messageInputAll.focus();
        });
        
        tabPrivate.addEventListener('click', () => {
            if (!selectedUser) {
                alert('Selecione um usuário para chat privado');
                tabAll.click();
                return;
            }
            tabPrivate.classList.add('active');
            tabAll.classList.remove('active');
            chatPrivate.classList.add('active');
            chatAll.classList.remove('active');
            messageInputPrivate.focus();
        });
        
        // Fechar chat privado
        closePrivateBtn.addEventListener('click', resetPrivateChat);
        
        // Enviar mensagens
        sendAllBtn.addEventListener('click', () => sendMessage(false));
        messageInputAll.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage(false);
        });
        
        sendPrivateBtn.addEventListener('click', () => sendMessage(true));
        messageInputPrivate.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage(true);
        });
        
        // Detectar digitação
        messageInputAll.addEventListener('input', () => handleTyping(false));
        messageInputPrivate.addEventListener('input', () => handleTyping(true));
        
        // Solicitar permissão de notificação
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }
    
    // Inicializar aplicativo
    function init() {
        initEvents();
    }
    
    init();
});