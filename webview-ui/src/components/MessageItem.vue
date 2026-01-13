<script setup lang="ts">
import { computed } from 'vue';
import type { ChatMessage } from '../../../src/interfaces/messages';

interface Props {
  message: ChatMessage;
}

const props = defineProps<Props>();

// Format timestamp
const formatTimestamp = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  // For older messages, show the actual date
  return dateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

// Get sender initials for avatar
const senderInitials = computed(() => {
  const displayName = props.message.sender.displayName || props.message.sender.name || 'Unknown';
  return displayName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
});

// Check if sender is a bot
const isBot = computed(() => {
  return props.message.sender.type === 'BOT';
});

// Format message timestamp
const messageTime = computed(() => {
  return formatTimestamp(props.message.createTime);
});

// Get message text or show fallback for unsupported content
const messageContent = computed(() => {
  if (props.message.text) {
    return props.message.text;
  }
  
  if (props.message.attachments && props.message.attachments.length > 0) {
    return `📎 Message contains ${props.message.attachments.length} attachment${props.message.attachments.length === 1 ? '' : 's'}`;
  }
  
  return 'Message content not available';
});
</script>

<template>
  <div class="message-item">
    <div class="message-avatar">
      <img 
        v-if="message.sender.avatarUrl" 
        :src="message.sender.avatarUrl" 
        :alt="message.sender.displayName"
        class="avatar-image"
      />
      <div 
        v-else 
        class="avatar-placeholder"
        :class="{ 'bot-avatar': isBot }"
      >
        {{ senderInitials }}
      </div>
    </div>
    
    <div class="message-content">
      <div class="message-header">
        <span class="sender-name" :class="{ 'bot-name': isBot }">
          {{ message.sender.displayName || message.sender.name }}
        </span>
        <span v-if="isBot" class="bot-badge">BOT</span>
        <span class="message-time">{{ messageTime }}</span>
      </div>
      
      <div class="message-text">
        {{ messageContent }}
      </div>
      
      <!-- Show attachment info if present -->
      <div v-if="message.attachments && message.attachments.length > 0" class="message-attachments">
        <div class="attachment-info">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V5.414A1.5 1.5 0 0 0 15.086 4L12 .914A1.5 1.5 0 0 0 10.914 0H2.5ZM2 2a.5.5 0 0 1 .5-.5h8.793a.5.5 0 0 1 .353.146L14 4v10a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V2Z"/>
          </svg>
          {{ message.attachments.length }} attachment{{ message.attachments.length === 1 ? '' : 's' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-item {
  display: flex;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--vscode-panel-border);
  transition: background-color 0.2s;
}

.message-item:hover {
  background-color: var(--vscode-list-hoverBackground);
}

.message-item:last-child {
  border-bottom: none;
}

.message-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.avatar-placeholder.bot-avatar {
  background-color: var(--vscode-textLink-foreground);
  color: var(--vscode-editor-background);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.sender-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--vscode-foreground);
}

.sender-name.bot-name {
  color: var(--vscode-textLink-foreground);
}

.bot-badge {
  background-color: var(--vscode-textLink-foreground);
  color: var(--vscode-editor-background);
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.message-time {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  margin-left: auto;
}

.message-text {
  color: var(--vscode-foreground);
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.message-attachments {
  margin-top: 8px;
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: var(--vscode-sideBar-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 6px;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
  max-width: fit-content;
}

.attachment-info svg {
  opacity: 0.7;
}

/* Responsive design */
@media (max-width: 768px) {
  .message-item {
    padding: 12px 16px;
    gap: 10px;
  }
  
  .message-avatar {
    width: 28px;
    height: 28px;
  }
  
  .avatar-placeholder {
    font-size: 11px;
  }
  
  .sender-name {
    font-size: 13px;
  }
  
  .message-text {
    font-size: 13px;
  }
}
</style>
