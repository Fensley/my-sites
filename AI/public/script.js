// Initialize axios with base URL
const api = axios.create({
  baseURL: "http://localhost:4000",
});

// State management
const state = {
  currentChatId: null,
  chats: JSON.parse(localStorage.getItem("chats") || "[]"),
  theme: localStorage.getItem("theme") || "light",
};

// Initialize the app
function initializeApp() {
  loadTheme();
  renderChatHistory();
  setupEventListeners();
  if (state.chats.length === 0) {
    showWelcomeMessage();
  } else {
    loadChat(state.chats[0].id);
  }
}

// Theme management
function loadTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem("theme", state.theme);
  loadTheme();
}

// Sidebar management
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
}

// Chat management
function startNewChat() {
  const chatId = Date.now().toString();
  const newChat = {
    id: chatId,
    title: "New Chat",
    messages: [],
  };

  state.chats.unshift(newChat);
  state.currentChatId = chatId;

  saveChats();
  renderChatHistory();
  clearChatWindow();
  updateChatTitle("New Chat");

  // Focus on input after creating new chat
  document.getElementById("userInput").focus();
}

function loadChat(chatId) {
  // Remove active class from all history items
  document.querySelectorAll(".history-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Add active class to selected chat
  const chatElement = document.querySelector(
    `.history-item[data-id="${chatId}"]`
  );
  if (chatElement) {
    chatElement.classList.add("active");
  }

  state.currentChatId = chatId;
  const chat = state.chats.find((c) => c.id === chatId);
  if (chat) {
    renderMessages(chat.messages);
    updateChatTitle(chat.title);
  }
}

function deleteChat(chatId) {
  if (!confirm("Are you sure you want to delete this chat?")) {
    return;
  }

  state.chats = state.chats.filter((chat) => chat.id !== chatId);
  saveChats();

  if (chatId === state.currentChatId) {
    if (state.chats.length > 0) {
      loadChat(state.chats[0].id);
    } else {
      state.currentChatId = null;
      showWelcomeMessage();
    }
  }

  renderChatHistory();
}

// Message handling
async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();

  if (!message) return;

  if (!state.currentChatId) {
    startNewChat();
  }

  // Add user message
  appendMessage("You", message);
  input.value = "";

  const currentChat = state.chats.find((c) => c.id === state.currentChatId);
  currentChat.messages.push({ role: "user", content: message });

  try {
    // Show loading state
    const loadingId = showLoading();

    // Send message to API
    const { data } = await api.post("/api/chat", { message });

    // Remove loading state
    removeLoading(loadingId);

    // Add AI response
    appendMessage("AI", data.response);
    currentChat.messages.push({ role: "ai", content: data.response });

    // Update chat title if it's the first message
    if (currentChat.messages.length === 2) {
      currentChat.title =
        message.slice(0, 30) + (message.length > 30 ? "..." : "");
      renderChatHistory();
    }

    saveChats();
  } catch (error) {
    console.error("Error:", error);
    appendMessage("Error", "Failed to get response from AI");
  }
}

// UI rendering
function renderChatHistory() {
  const historyList = document.getElementById("chatHistoryList");
  historyList.innerHTML = state.chats
    .map(
      (chat) => `
      <div class="history-item ${
        chat.id === state.currentChatId ? "active" : ""
      }" 
           data-id="${chat.id}">
          <div class="history-item-content" onclick="loadChat('${chat.id}')">
              <span class="material-symbols-outlined">chat</span>
              ${escapeHtml(chat.title)}
          </div>
          <button class="delete-chat-btn" onclick="deleteChat('${chat.id}')">
              <span class="material-symbols-outlined">close</span>
          </button>
      </div>
  `
    )
    .join("");
}

function renderMessages(messages) {
  const chatHistory = document.getElementById("chatHistory");
  if (!messages || messages.length === 0) {
    showWelcomeMessage();
    return;
  }

  chatHistory.innerHTML = messages
    .map(
      (msg) => `
    <div class="message ${msg.role}-message">
        ${formatMessage(msg.content)}
    </div>
  `
    )
    .join("");
  scrollToBottom();
}

function appendMessage(sender, message) {
  const chatHistory = document.getElementById("chatHistory");

  const welcomeMessage = chatHistory.querySelector(".welcome-message");
  if (welcomeMessage) {
    welcomeMessage.remove();
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender.toLowerCase()}-message`;
  messageDiv.innerHTML = formatMessage(message);
  chatHistory.appendChild(messageDiv);
  scrollToBottom();
}

function formatMessage(message) {
  // Simple paragraph formatting
  const paragraphs = message.split("\n").filter((p) => p.trim());
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

// Loading state
function showLoading() {
  const id = Date.now();
  const chatHistory = document.getElementById("chatHistory");
  const loadingDiv = document.createElement("div");
  loadingDiv.id = `loading-${id}`;
  loadingDiv.className = "message ai-message loading";
  loadingDiv.textContent = "AI is thinking";
  chatHistory.appendChild(loadingDiv);
  scrollToBottom();
  return id;
}

function removeLoading(id) {
  const loadingDiv = document.getElementById(`loading-${id}`);
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

// Utility functions
function showWelcomeMessage() {
  const chatHistory = document.getElementById("chatHistory");
  chatHistory.innerHTML = `
    <div class="welcome-message">
      <h1>Welcome to AI Chat</h1>
      <p>Start a conversation with your AI assistant</p>
    </div>
  `;
  updateChatTitle("New Chat");
}

function clearChatWindow() {
  showWelcomeMessage();
}

function updateChatTitle(title) {
  document.querySelector(".chat-header h2").textContent = title;
}

function scrollToBottom() {
  const chatHistory = document.getElementById("chatHistory");
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function saveChats() {
  localStorage.setItem("chats", JSON.stringify(state.chats));
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Event listeners
function setupEventListeners() {
  // Enter key to send message
  document.getElementById("userInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Send button click
  document.querySelector(".send-btn").addEventListener("click", sendMessage);

  // Mobile responsive sidebar
  if (window.innerWidth <= 768) {
    document.querySelectorAll(".history-item").forEach((item) => {
      item.addEventListener("click", toggleSidebar);
    });
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById("sidebar");
      const toggleBtn = document.querySelector(".toggle-sidebar");
      if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove("active");
      }
    }
  });
}

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", initializeApp);
