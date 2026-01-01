# 📚 Guia de Uso - Chat em Tempo Real

## 🚀 Como Iniciar

### 1. Instalação das Dependências
```bash
cd backend
npm install
```

### 2. Iniciar o Servidor
```bash
npm start
```

Você deve ver no console:
```
==================================================
🚀 Servidor rodando na porta 3000
🌐 Acesse: http://localhost:3000
📡 Socket.IO está pronto para conexões
==================================================
✅ Conectado ao banco de dados SQLite!
✅ Tabela users criada/verificada
✅ Tabela messages criada/verificada
```

### 3. Acessar a Aplicação
Abra no navegador: `http://localhost:3000`

---

## 💬 Funcionalidades

### 1️⃣ Chat Público (Mensagens para Todos)

**Como usar:**
1. Faça login com seu nome
2. Na aba "Chat Geral", digite sua mensagem
3. Pressione Enter ou clique no botão de enviar
4. ✅ Todos na sala verão sua mensagem em tempo real

**Características:**
- Mensagens aparecem com seu nome e hora
- Seu nome aparece à direita (em roxo)
- Outros nomes aparecem à esquerda (em branco)
- Histórico de até 50 últimas mensagens carregado ao entrar

---

### 2️⃣ Chat Privado (Mensagens Diretas)

**Como usar:**
1. No painel esquerdo "Online", clique no nome de outro usuário
2. Você será automaticamente levado à aba "Privado"
3. Digite sua mensagem privada
4. Pressione Enter ou clique no botão de enviar
5. ✅ Apenas você e o outro usuário verão a mensagem

**Características:**
- Mensagens marcadas com um cadeado 🔒
- Histórico privado por usuário
- Usuário selecionado fica destacado

---

### 3️⃣ Indicador "Está Digitando"

**Como funciona:**
- Quando você digita algo, sua digitação é comunicada aos outros
- No painel de usuários, aparece: **"[Seu Nome] está digitando..."**
- O indicador desaparece 1.5 segundos depois que você para de digitar

**Exemplo:**
```
👥 Online 3
  Alice
  Bob (está digitando...)  ← Indicador aparece
  Carlos
```

---

### 4️⃣ Lista de Usuários Online

**Painel de usuários (lado esquerdo):**
- Mostra todos os usuários conectados no momento
- Contador no topo mostra quantos estão online
- Seu nome aparece com "(Você)"
- Clique em um usuário para abrir chat privado

**Características:**
- Avatar com iniciais do nome
- Cores dos avatares aleatórias
- Usuário selecionado fica com fundo azul

---

### 5️⃣ Histórico de Mensagens

**Histórico Público:**
- Ao conectar, as últimas 50 mensagens públicas são carregadas
- Todas as mensagens novas são salvas automaticamente

**Histórico Privado:**
- Ao selecionar um usuário, seu histórico de conversa aparece
- Todas as mensagens trocadas com esse usuário são mantidas
- Você pode voltar para uma conversa e ver tudo o que foi dito

---

## 🎯 Exemplos de Uso

### Cenário 1: Dois Usuários Chattando
```
Alice: Oi Bob!
Bob: Oi Alice! Como vai?
Alice: Tudo bem, e você?
```

### Cenário 2: Mensagem Privada
```
Alice clica em Bob → Aba Privado se abre
Alice escreve: "Pode falar com você?"
Bob recebe apenas essa mensagem (os outros não veem)
```

### Cenário 3: Múltiplos Usuários
```
Sala de chat:
- Alice
- Bob  
- Carlos
- Diana

Todos podem se ver na lista online
Qualquer um pode iniciar chat privado com outro
Mensagens públicas vão para todos
```

---

## ⚙️ Tecnologias Utilizadas

| Componente | Tecnologia |
|-----------|-----------|
| Servidor | Node.js + Express.js |
| Tempo Real | Socket.IO v4.8.3 |
| Banco de Dados | SQLite3 |
| Frontend | HTML5 + CSS3 + JavaScript |
| Ícones | FontAwesome 6.4.0 |

---

## 📊 Estrutura de Dados

### Usuários Conectados (Em Memória)
```javascript
Map {
  'socket_id_1' => 'Alice',
  'socket_id_2' => 'Bob',
  'socket_id_3' => 'Carlos'
}
```

### Banco de Dados SQLite

**Tabela: users**
```
id | username | socket_id | online | created_at
---|----------|-----------|--------|------------
1  | Alice    | xxx123    | 1      | 2025-12-31...
2  | Bob      | yyy456    | 1      | 2025-12-31...
```

**Tabela: messages**
```
id | sender | receiver | message     | is_private | created_at
---|--------|----------|-------------|------------|------------
1  | Alice  | all      | Olá a todos!| 0          | 2025-12-31...
2  | Alice  | Bob      | Oi Bob!     | 1          | 2025-12-31...
3  | Bob    | all      | Oi pessoal! | 0          | 2025-12-31...
```

---

## 🔧 Troubleshooting

### Porta 3000 já em uso
```bash
# Mude a porta no server.js ou:
# Windows: netstat -ano | findstr :3000
# Mac/Linux: lsof -i :3000
```

### Mensagens não aparecem
1. Verifique o console do servidor (deve estar rodando)
2. Abra o DevTools (F12) no navegador
3. Verifique a aba "Network" - deve haver conexão Socket.IO

### Usuários não aparecem na lista
- Verifique se há conexão Socket.IO ativa
- Recarregue a página
- Verifique o banco de dados: `chat.db`

### Chat privado não funciona
1. Certifique-se que ambos usuários estão online
2. Clique no usuário novamente
3. Verifique se a aba "Privado" está ativa

---

## 📝 Notas Importantes

✅ **Backup de Dados**: O arquivo `chat.db` contém todo o histórico
✅ **Persistência**: Mensagens são salvas mesmo que desconecte
✅ **Segurança**: Use em redes locais/trusted apenas
✅ **Performance**: Suporta centenas de usuários simultâneos

---

## 🎓 Para Fins Educacionais

Este projeto foi desenvolvido para a disciplina:
**Sistemas Distribuídos e Paralelos I - ISPPU**

Demonstra os conceitos de:
- ✅ Comunicação em tempo real
- ✅ Arquitetura cliente-servidor
- ✅ Persistência de dados distribuída
- ✅ Tratamento de eventos assíncronos
- ✅ Gerenciamento de estado compartilhado

---

**Desenvolvido com ❤️ para ISPPU**
