<script setup lang="ts">
import { computed } from "vue";
import type { ChatSpace, ChatMessage } from "../../../src/interfaces/messages";
import MessageList from "./MessageList.vue";
import ChatInput from "./ChatInput.vue";

interface Props {
    space: ChatSpace | null;
    messages: ChatMessage[];
    isLoading: boolean;
    error: string;
}

interface Emits {
    (e: "back-to-main"): void;
    (e: "refresh-messages"): void;
    (e: "send-message", text: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Handle back navigation
function handleBack() {
    emit("back-to-main");
}

// Handle refresh messages
function handleRefresh() {
    emit("refresh-messages");
}

// Handle sending message
function handleSendMessage(text: string) {
    emit("send-message", text);
}

// Computed properties
const spaceName = computed(() => {
    return props.space?.displayName || props.space?.name || "Unknown Space";
});

const spaceDescription = computed(() => {
    return props.space?.description || "";
});
</script>

<template>
    <div class="chat-view">
        <!-- Header -->
        <header class="chat-header">
            <div class="header-content">
                <button
                    @click="handleBack"
                    class="back-button"
                    title="Back to main view"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                    >
                        <path
                            d="M9.78 3.22a.751.751 0 0 1 0 1.06L6.06 8l3.72 3.72a.751.751 0 1 1-1.06 1.06L4.47 8.53a.751.751 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.06 0Z"
                        />
                    </svg>
                    Back
                </button>

                <div class="space-info">
                    <h1 class="space-name">{{ spaceName }}</h1>
                    <p v-if="spaceDescription" class="space-description">
                        {{ spaceDescription }}
                    </p>
                </div>
            </div>
        </header>

        <!-- Messages Content -->
        <main class="chat-content">
            <MessageList
                :messages="messages"
                :is-loading="isLoading"
                :error="error"
            />
        </main>

        <!-- Chat Input -->
        <ChatInput
            :disabled="isLoading || !space"
            :is-loading="isLoading"
            :placeholder="
                space
                    ? `Message ${spaceName}...`
                    : 'Select a space to start chatting'
            "
            @send-message="handleSendMessage"
            @refresh-messages="handleRefresh"
        />
    </div>
</template>

<style scoped>
.chat-view {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: var(--vscode-editor-background);
    color: var(--vscode-foreground);
}

.chat-header {
    padding: 12px 20px;
    border-bottom: 1px solid var(--vscode-panel-border);
    background-color: var(--vscode-sideBar-background);
    min-height: 60px;
}

.header-content {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
}

.back-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background-color: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background-color 0.2s;
    flex-shrink: 0;
}

.back-button:hover {
    background-color: var(--vscode-button-secondaryHoverBackground);
}

.space-info {
    flex: 1;
    min-width: 0;
}

.space-name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--vscode-foreground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.space-description {
    margin: 2px 0 0 0;
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.header-right {
    flex-shrink: 0;
}

.refresh-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background-color 0.2s;
}

.refresh-button:hover:not(:disabled) {
    background-color: var(--vscode-button-hoverBackground);
}

.refresh-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.chat-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* Responsive design */
@media (max-width: 768px) {
    .chat-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        padding: 16px 20px;
    }

    .header-left {
        flex-direction: column;
        align-items: flex-start;
    }

    .space-info {
        width: 100%;
    }

    .header-right {
        align-self: flex-end;
    }
}
</style>
