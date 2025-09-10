<script setup lang="ts">
import { computed } from 'vue';
import type { ChatSpace } from '../../../src/interfaces/messages';

interface Props {
  searchQuery: string;
}

interface Emits {
  (e: 'select-group', spaceId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Predefined support groups
const supportGroups: ChatSpace[] = [
  {
    id: 'java-support',
    name: 'Java Support',
    displayName: 'Java Support',
    description: 'Get help with Java development, frameworks, and best practices',
    type: 'support',
    memberCount: 1247
  },
  {
    id: 'dotnet-support',
    name: '.NET Support',
    displayName: '.NET Support',
    description: 'C#, ASP.NET, Entity Framework, and .NET ecosystem support',
    type: 'support',
    memberCount: 892
  },
  {
    id: 'python-support',
    name: 'Python Support',
    displayName: 'Python Support',
    description: 'Python programming, Django, Flask, data science, and more',
    type: 'support',
    memberCount: 1563
  },
  {
    id: 'javascript-support',
    name: 'JavaScript Support',
    displayName: 'JavaScript Support',
    description: 'JavaScript, Node.js, ES6+, and web development support',
    type: 'support',
    memberCount: 2104
  },
  {
    id: 'react-support',
    name: 'React Support',
    displayName: 'React Support',
    description: 'React.js, Next.js, Redux, and React ecosystem help',
    type: 'support',
    memberCount: 1789
  },
  {
    id: 'angular-support',
    name: 'Angular Support',
    displayName: 'Angular Support',
    description: 'Angular framework, TypeScript, and Angular CLI support',
    type: 'support',
    memberCount: 967
  },
  {
    id: 'cpp-support',
    name: 'C++ Support',
    displayName: 'C++ Support',
    description: 'C++ programming, STL, modern C++, and performance optimization',
    type: 'support',
    memberCount: 743
  },
  {
    id: 'go-support',
    name: 'Go Support',
    displayName: 'Go Support',
    description: 'Go programming, concurrency, web services, and tooling',
    type: 'support',
    memberCount: 521
  },
  {
    id: 'rust-support',
    name: 'Rust Support',
    displayName: 'Rust Support',
    description: 'Rust programming, memory safety, and system programming',
    type: 'support',
    memberCount: 456
  },
  {
    id: 'php-support',
    name: 'PHP Support',
    displayName: 'PHP Support',
    description: 'PHP development, Laravel, Symfony, and web applications',
    type: 'support',
    memberCount: 834
  },
  {
    id: 'ruby-support',
    name: 'Ruby Support',
    displayName: 'Ruby Support',
    description: 'Ruby programming, Rails, gems, and web development',
    type: 'support',
    memberCount: 412
  },
  {
    id: 'swift-support',
    name: 'Swift Support',
    displayName: 'Swift Support',
    description: 'Swift programming, iOS development, and Xcode support',
    type: 'support',
    memberCount: 687
  }
];

// Computed filtered groups based on search query
const filteredGroups = computed(() => {
  if (!props.searchQuery.trim()) {
    return supportGroups;
  }
  
  const query = props.searchQuery.toLowerCase();
  return supportGroups.filter(group => 
    group.name.toLowerCase().includes(query) ||
    group.description?.toLowerCase().includes(query)
  );
});

function selectGroup(group: ChatSpace) {
  emit('select-group', group.id);
}

function formatMemberCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}
</script>

<template>
  <div class="support-groups-list">
    <div v-if="filteredGroups.length === 0" class="no-results">
      <div class="no-results-icon">🔍</div>
      <p class="no-results-text">No support groups found for "{{ searchQuery }}"</p>
    </div>
    
    <div v-else class="groups-container">
      <div
        v-for="group in filteredGroups"
        :key="group.id"
        @click="selectGroup(group)"
        class="group-item"
        :title="`Join ${group.name}`"
      >
        <div class="group-header">
          <div class="group-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"/>
            </svg>
          </div>
          <div class="group-info">
            <h3 class="group-name">{{ group.displayName || group.name }}</h3>
            <p class="group-description">{{ group.description }}</p>
          </div>
        </div>
        
        <div class="group-meta">
          <span class="member-count">
            {{ formatMemberCount(group.memberCount || 0) }} members
          </span>
          <div class="join-indicator">
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
.support-groups-list {
  height: 100%;
}

.groups-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-item {
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

.group-item:hover {
  background-color: var(--vscode-list-hoverBackground);
  border-color: var(--vscode-list-hoverForeground);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.group-item:active {
  transform: translateY(0);
}

.group-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.group-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border-radius: 6px;
  flex-shrink: 0;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-foreground);
  line-height: 1.3;
}

.group-description {
  margin: 0;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.group-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.member-count {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  white-space: nowrap;
}

.join-indicator {
  display: flex;
  align-items: center;
  color: var(--vscode-textLink-foreground);
  opacity: 0;
  transition: opacity 0.2s;
}

.group-item:hover .join-indicator {
  opacity: 1;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.no-results-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.no-results-text {
  margin: 0;
  color: var(--vscode-descriptionForeground);
  font-size: 14px;
}

/* Responsive design */
@media (max-width: 768px) {
  .group-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .group-meta {
    align-self: flex-end;
  }
}
</style>
