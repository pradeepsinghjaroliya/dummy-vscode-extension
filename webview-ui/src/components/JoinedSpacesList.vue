<script setup lang="ts">
import type { ChatSpace } from '../../../src/interfaces/messages';

interface Props {
  spaces: ChatSpace[];
  isLoading: boolean;
  error: string;
  isSignedIn: boolean;
}

interface Emits {
  (e: 'select-space', spaceId: string): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

function selectSpace(space: ChatSpace) {
  emit('select-space', space.id);
}

function formatMemberCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

function formatLastActivity(date?: Date | string): string {
  if (!date) return '';
  
  // Convert string dates to Date objects
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if it's a valid date
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
  return dateObj.toLocaleDateString();
}
</script>

<template>
  <div class="joined-spaces-list">
    <!-- Not signed in state -->
    <div v-if="!isSignedIn" class="not-signed-in">
      <div class="not-signed-in-icon">🔐</div>
      <h3 class="not-signed-in-title">Sign In Required</h3>
      <p class="not-signed-in-text">
        Please sign in with your access token to view your joined Google Chat spaces.
      </p>
    </div>

    <!-- Error state -->
    <div v-else-if="error && error.trim().length > 0" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">Error</h3>
      <p class="error-text">{{ error }}</p>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoading" class="loading-state">
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
      <p class="loading-text">Loading your spaces...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="spaces.length === 0" class="empty-state">
      <div class="empty-icon">💬</div>
      <h3 class="empty-title">No Spaces Found</h3>
      <p class="empty-text">
        You don't have any Google Chat spaces yet, or they couldn't be loaded.
      </p>
    </div>

    <!-- Spaces list -->
    <div v-else class="spaces-container">
      <div
        v-for="space in spaces"
        :key="space.id"
        @click="selectSpace(space)"
        class="space-item"
        :title="`Open ${space.name}`"
      >
        <div class="space-header">
          <div class="space-avatar">
            <img 
              v-if="space.avatarUrl" 
              :src="space.avatarUrl" 
              :alt="space.name"
              class="space-avatar-image"
            />
            <div v-else class="space-avatar-placeholder">
              {{ (space.displayName || space.name).charAt(0).toUpperCase() }}
            </div>
          </div>
          
          <div class="space-info">
            <h3 class="space-name">{{ space.displayName || space.name }}</h3>
            <p v-if="space.description" class="space-description">
              {{ space.description }}
            </p>
            <div class="space-meta">
              <span v-if="space.memberCount" class="member-count">
                {{ formatMemberCount(space.memberCount) }} members
              </span>
              <span v-if="space.lastActivity" class="last-activity">
                • {{ formatLastActivity(space.lastActivity) }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="space-actions">
          <div class="space-indicator">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.22 3.22a.751.751 0 0 1 1.06 0l4.25 4.25a.751.751 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.751.751 0 0 1 0-1.06Z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.joined-spaces-list {
  height: 100%;
}

/* State containers */
.not-signed-in,
.error-state,
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  height: 100%;
  min-height: 200px;
}

.not-signed-in-icon,
.error-icon,
.empty-icon {
  font-size: 32px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.not-signed-in-title,
.error-title,
.empty-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vscode-foreground);
}

.not-signed-in-text,
.error-text,
.empty-text {
  margin: 0;
  color: var(--vscode-descriptionForeground);
  font-size: 14px;
  line-height: 1.4;
  max-width: 300px;
}

.error-text {
  color: var(--vscode-errorForeground);
}

/* Loading state */
.loading-spinner {
  color: var(--vscode-textLink-foreground);
  margin-bottom: 16px;
}

.loading-text {
  margin: 0;
  color: var(--vscode-descriptionForeground);
  font-size: 14px;
}

/* Spaces list */
.spaces-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.space-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: var(--vscode-list-inactiveSelectionBackground);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.space-item:hover {
  background-color: var(--vscode-list-hoverBackground);
  border-color: var(--vscode-list-hoverForeground);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.space-item:active {
  transform: translateY(0);
}

.space-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.space-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.space-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.space-avatar-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.space-info {
  flex: 1;
  min-width: 0;
}

.space-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-foreground);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-description {
  margin: 0 0 6px 0;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.space-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
}

.member-count,
.last-activity {
  white-space: nowrap;
}

.space-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.space-indicator {
  display: flex;
  align-items: center;
  color: var(--vscode-textLink-foreground);
  opacity: 0;
  transition: opacity 0.2s;
}

.space-item:hover .space-indicator {
  opacity: 1;
}

/* Responsive design */
@media (max-width: 768px) {
  .space-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .space-actions {
    align-self: flex-end;
  }
  
  .space-header {
    width: 100%;
  }
}
</style>
