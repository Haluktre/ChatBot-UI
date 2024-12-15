const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');
let sessionId = Math.random().toString(36).substr(2, 9);
let uploadedFile = null;

sendButton.addEventListener('click', () => {
sendMessage();
});

userInput.addEventListener('keydown', (event) => {
if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
}
});

async function sendMessage() {
const userMessage = userInput.value.trim();

if (!userMessage && !uploadedFile) return;

if (userMessage) {
    addMessage(userMessage, 'user');
}

if (uploadedFile) {
    const imageMessage = document.createElement('div');
    imageMessage.classList.add('message', 'user');
    const imageElement = document.createElement('img');
    imageElement.src = URL.createObjectURL(uploadedFile);
    imageMessage.appendChild(imageElement);
    messagesContainer.appendChild(imageMessage);
}

userInput.value = '';

addMessage('Yükleniyor...', 'loading');

try {
    let response;

    if (uploadedFile) {
    const formData = new FormData();
    formData.append('image', uploadedFile);
    formData.append('message', userMessage || 'Resmi açıkla');
    formData.append('session', sessionId);

    response = await fetch('https://www.halukture0.online/image_describer', {
        signal: AbortSignal.timeout(180000),
        method: 'POST',
        body: formData,
    },180000);
    } else {
    response = await fetch('https://www.halukture0.online/chat_ai', {
        signal: AbortSignal.timeout(180000),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, session: sessionId }),
    },180000);
    }

    const data = await response.json();
    displayResponse(data["message"]);
} catch (error) {
    displayResponse('Bir hata oluştu!');
} finally {
    uploadedFile = null; // Gönderim sonrası temizle
    uploadStatus.textContent = '';
}
}

fileInput.addEventListener('change', (event) => {
uploadedFile = event.target.files[0];
if (uploadedFile) {
    uploadStatus.textContent = limitText(uploadedFile.name, 15) + `(Yüklendi)`;
}
});

function addMessage(content, type) {
const message = document.createElement('div');
message.classList.add('message', type);
if (type === 'user') message.style.backgroundColor = '#3f51b5';
message.textContent = content;
if (type === 'loading') message.id = 'loading-message';
messagesContainer.appendChild(message);
messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function limitText(text, limit) {
if (text.length > limit) {
    return text.substring(0, limit) + '...';
} else {
    return text;
}
}

function displayResponse(response) {
const loadingMessage = document.getElementById('loading-message');
if (loadingMessage) loadingMessage.remove();

const messageContainer = document.createElement('div');
messageContainer.classList.add('message', 'bot');

// Yanıtı Markdown benzeri işleme ile ele alalım
const processText = (text) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    text = text.replace(boldRegex, '<strong>$1</strong>');
    return text.replace(/\n/g, '<br>');
};

if (response.includes("```")) {
    const parts = response.split(/```/);
    parts.forEach((part, index) => {
    if (index % 2 === 0) {
        if (part.trim()) {
        const processedText = processText(part.trim());
        const textNode = document.createElement('p');
        textNode.innerHTML = processedText;
        messageContainer.appendChild(textNode);
        }
    } else {
        const [firstLine, ...codeLines] = part.trim().split('\n');
        const language = firstLine.match(/[a-zA-Z]+/) ? firstLine.trim() : 'javascript';
        const codeContent = language === firstLine ? codeLines.join('\n') : part.trim();

        const highlightedCode = document.createElement('div');
        highlightedCode.classList.add('highlight');
        highlightedCode.innerHTML = `
        <pre class="language-${language.toLowerCase()}"><code>${Prism.highlight(codeContent, Prism.languages[language.toLowerCase()] || Prism.languages.javascript, language)}</code></pre>
        <button class="copy-button">Kopyala</button>
        `;
        messageContainer.appendChild(highlightedCode);

        const copyButton = highlightedCode.querySelector('.copy-button');
        copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(codeContent);
        });
    }
    });
} else {
    const processedText = processText(response);
    const textNode = document.createElement('p');
    textNode.innerHTML = processedText;
    messageContainer.appendChild(textNode);
}

messagesContainer.appendChild(messageContainer);
messagesContainer.scrollTop = messagesContainer.scrollHeight;
}