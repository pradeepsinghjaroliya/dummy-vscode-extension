<script setup lang="ts">
import { ref, nextTick } from 'vue';

interface Props {
  disabled?: boolean;
  placeholder?: string;
}

interface Emits {
  (e: 'send-message', text: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder: 'Type a message...'
});

const emit = defineEmits<Emits>();

const messageText = ref('');
const textareaRef = ref<HTMLTextAreaElement>();

// Handle sending message
function handleSend() {
  const text = messageText.value.trim();
  if (text && !props.disabled) {
    emit('send-message', text);
    messageText.value = '';
    adjustTextareaHeight();
  }
}

// Handle key events
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}

// Auto-adjust textarea height
function adjustTextareaHeight() {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto';
      textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 120) + 'px';
    }
  });
}

// Watch for input changes to adjust height
function handleInput() {
  adjustTextareaHeight();
}
</script>

<template>
  <div class="chat-input">
    <div class="input-container">
      <textarea
        ref="textareaRef"
        v-model="messageText"
        :placeholder="placeholder"
        :disabled="disabled"
        class="message-input"
        rows="1"
        @keydown="handleKeyDown"
        @input="handleInput"
      />
      
      <button
        @click="handleSend"
        :disabled="disabled || !messageText.trim()"
        class="send-button"
        title="Send message (Enter)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path 
            d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" 
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
    
    <div class="input-hint">
      <span class="hint-text">Press Enter to send • Shift+Enter for new line</span>
    </div>
  </div>
</template>

<style scoped>
.chat-input {
  padding: 16px 20px;
  border-top: 1px solid var(--vscode-panel-border);
  background-color: var(--vscode-sideBar-background);
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background-color: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 8px;
  padding: 12px;
  transition: border-color 0.2s;
}

.input-container:focus-within {
  border-color: var(--vscode-focusBorder);
  outline: 1px solid var(--vscode-focusBorder);
}

.message-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--vscode-input-foreground);
  font-family: var(--vscode-font-family);
  font-size: 14px;
  line-height: 1.4;
  resize: none;
  outline: none;
  min-height: 20px;
  max-height: 120px;
  overflow-y: auto;
}

.message-input::placeholder {
  color: var(--vscode-input-placeholderForeground);
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  background-color: var(--vscode-button-hoverBackground);
}

.send-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: var(--vscode-button-secondaryBackground);
}

.input-hint {
  margin-top: 8px;
  text-align: center;
}

.hint-text {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  opacity: 0.8;
}

/* Scrollbar styling for textarea */
.message-input::-webkit-scrollbar {
  width: 6px;
}

.message-input::-webkit-scrollbar-track {
  background: transparent;
}

.message-input::-webkit-scrollbar-thumb {
  background: var(--vscode-scrollbarSlider-background);
  border-radius: 3px;
}

.message-input::-webkit-scrollbar-thumb:hover {
  background: var(--vscode-scrollbarSlider-hoverBackground);
}
</style>
