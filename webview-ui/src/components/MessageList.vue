<script setup lang="ts">
import { ref, nextTick, onMounted, onUpdated } from 'vue';
import type { ChatMessage } from '../../../src/interfaces/messages';
import MessageItem from './MessageItem.vue';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string;
}

defineProps<Props>();

const messagesContainer = ref<HTMLElement>();

// Auto-scroll to bottom when new messages are added
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

onMounted(() => {
  scrollToBottom();
});

onUpdated(() => {
  scrollToBottom();
});
</script>

<template>
  <div class="message-list">
    <!-- Loading state -->
    <div v-if="isLoading && messages.length === 0" class="loading-state">
      <div class="loading-spinner">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round"
            stroke-dasharray="32"
            stroke-dashoffset="32"
          >
            <animate 
              attributeName="stroke-dasharray" 
              dur="2s" 
              values="0 32;16 16;0 32;0 32" 
              repeatCount="indefinite"
            />
            <animate 
              attributeName="stroke-dashoffset" 
              dur="2s" 
              values="0;-16;-32;-32" 
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
      <p class="loading-text">Loading messages...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error && error.trim().length > 0" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">Error Loading Messages</h3>
      <p class="error-text">{{ error }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="messages.length === 0" class="empty-state">
      <div class="empty-icon">💬</div>
      <h3 class="empty-title">No Messages</h3>
      <p class="empty-text">
        This space doesn't have any messages yet, or they couldn't be loaded.
      </p>
    </div>

    <!-- Messages list -->
    <div v-else class="messages-container" ref="messagesContainer">
      <div class="messages-header">
        <p class="messages-count">{{ messages.length }} message{{ messages.length === 1 ? '' : 's' }}</p>
      </div>
      
      <div class="messages-list">
        <MessageItem
          v-for="message in messages"
          :key="message.name"
          :message="message"
        />
      </div>
      
      <!-- Loading indicator for when refreshing -->
      <div v-if="isLoading" class="refreshing-indicator">
        <div class="refreshing-spinner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round"
              stroke-dasharray="32"
              stroke-dashoffset="32"
            >
              <animate 
                attributeName="stroke-dasharray" 
                dur="1s" 
                values="0 32;16 16;0 32;0 32" 
                repeatCount="indefinite"
              />
              <animate 
                attributeName="stroke-dashoffset" 
                dur="1s" 
                values="0;-16;-32;-32" 
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>
        <span class="refreshing-text">Refreshing...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--vscode-editor-background);
}

/* State containers */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  height: 100%;
  min-height: 300px;
}

.loading-spinner,
.error-icon,
.empty-icon {
  margin-bottom: 16px;
}

.loading-spinner {
  color: var(--vscode-textLink-foreground);
}

.error-icon,
.empty-icon {
  font-size: 32px;
  opacity: 0.6;
}

.loading-text,
.error-title,
.empty-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vscode-foreground);
}

.loading-text {
  font-size: 14px;
  font-weight: normal;
  color: var(--vscode-descriptionForeground);
}

.error-text,
.empty-text {
  margin: 0;
  color: var(--vscode-descriptionForeground);
  font-size: 14px;
  line-height: 1.4;
  max-width: 400px;
}

.error-text {
  color: var(--vscode-errorForeground);
}

/* Messages container */
.messages-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages-header {
  padding: 12px 20px;
  border-bottom: 1px solid var(--vscode-panel-border);
  background-color: var(--vscode-sideBar-background);
}

.messages-count {
  margin: 0;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

/* Refreshing indicator */
.refreshing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background-color: var(--vscode-sideBar-background);
  border-top: 1px solid var(--vscode-panel-border);
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
}

.refreshing-spinner {
  color: var(--vscode-textLink-foreground);
}

.refreshing-text {
  font-weight: 500;
}

/* Scrollbar styling */
.messages-list::-webkit-scrollbar {
  width: 8px;
}

.messages-list::-webkit-scrollbar-track {
  background: var(--vscode-scrollbarSlider-background);
}

.messages-list::-webkit-scrollbar-thumb {
  background: var(--vscode-scrollbarSlider-background);
  border-radius: 4px;
}

.messages-list::-webkit-scrollbar-thumb:hover {
  background: var(--vscode-scrollbarSlider-hoverBackground);
}
</style>
