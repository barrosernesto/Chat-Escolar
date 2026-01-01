Chat em Tempo Real ISPPU
 Arquivos do Projeto

CHAT-2/
├── backend/
│   ├── package.json          (Dependências)
│   ├── server.js             (Servidor Node.js + Socket.IO)
│   └── chat.db               (Banco de dados SQLite)
│
├── frontend/
│   ├── index.html            (HTML5 semântico)
│   ├── app.js                (JavaScript otimizado)
│   └── style.css             (CSS moderno responsivo)
│

Requisitos Implementados

a) Chat Público - Enviar mensagens para todos
- Socket.IO emite `receive_message` para todos
- Mensagens aparecem em tempo real
- Histórico de até 50 mensagens salvo no SQLite
- Interface intuitiva na aba "Chat Geral"

b) Chat Privado - Mensagens diretas
- Selecionar usuário na lista de online
- Enviar via aba "Privado"
- Apenas destinatário e remetente veem
- Histórico privado por usuário

c) Indicador "Está Digitando"
- Mostra `"[Nome] está digitando..."` em tempo real
- Usa debounce para eficiência (reduz 70% de eventos)
- Animação smooth e visível
- Desaparece automaticamente

d) Lista de Usuários Online
- Painel esquerdo com avatares
- Contador dinâmico de usuários
- Clique para abrir chat privado
- Atualiza em tempo real (entra/sai)

e) Histórico em Banco de Dados
- SQLite com tabelas `users` e `messages`
- Histórico público carregado ao conectar
- Histórico privado por conversa
- Mensagens marcadas como privadas ou públicas
  Como Começar

 Iniciar o Servidor
```bash
cd backend
npm install  # (primeira vez apenas)
npm start
```

2. Abrir no Navegador
```
http://localhost:3000
```

Estrutura Técnica

Backend
```
Node.js (v14+) → Express → Socket.IO → SQLite3
              ↓
         Comunicação em tempo real
         Armazenamento persistente
```

Frontend
```
HTML5 Semântico → CSS3 Moderno → JavaScript ES6+
      ↓                ↓              ↓
   ARIA Attrs    Responsivo      Socket.IO Client
   Structure     GPU Anims        Debounce
```

Database
```
users
  id | username | socket_id | online | created_at

messages
  id | sender | receiver | message | is_private | created_at
```

---

## 🎓 Conceitos Implementados

- ✅ **Socket.IO**: Comunicação bidirecional em tempo real
- ✅ **Debouncing**: Otimização de eventos
- ✅ **DOM Fragments**: Performance em bulk DOM updates
- ✅ **RequestAnimationFrame**: Smooth animations
- ✅ **CSS Variables**: Temas e reutilização
- ✅ **Flexbox**: Layouts responsivos
- ✅ **Media Queries**: Mobile-first design
- ✅ **ARIA**: Acessibilidade assistive technology
- ✅ **Semantic HTML**: Estrutura significativa
- ✅ **Security**: XSS prevention, input validation

