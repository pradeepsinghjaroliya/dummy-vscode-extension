<script setup lang="ts">
import { ref, nextTick } from "vue";

interface Props {
    disabled?: boolean;
    placeholder?: string;
    isLoading?: boolean;
}

interface Emits {
    (e: "send-message", text: string): void;
    (e: "refresh-messages"): void;
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    placeholder: "Type a message...",
    isLoading: false,
});

const emit = defineEmits<Emits>();

const messageText = ref("");
const textareaRef = ref<HTMLTextAreaElement>();

// Handle sending message
function handleSend() {
    const text = messageText.value.trim();
    if (text && !props.disabled) {
        emit("send-message", text);
        messageText.value = "";
        adjustTextareaHeight();
    }
}

// Handle refresh messages
function handleRefresh() {
    emit("refresh-messages");
}

// Handle key events
function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
    }
}

// Auto-adjust textarea height
function adjustTextareaHeight() {
    nextTick(() => {
        if (textareaRef.value) {
            textareaRef.value.style.height = "auto";
            textareaRef.value.style.height =
                Math.min(textareaRef.value.scrollHeight, 120) + "px";
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
                @click="handleRefresh"
                :disabled="isLoading"
                class="refresh-button"
                title="Refresh messages"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                >
                    <path
                        d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"
                    />
                </svg>
            </button>

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

.refresh-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background-color: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    flex-shrink: 0;
}

.refresh-button:hover:not(:disabled) {
    background-color: var(--vscode-button-secondaryHoverBackground);
}

.refresh-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
