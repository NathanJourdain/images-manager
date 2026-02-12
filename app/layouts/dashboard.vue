<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { data: session } = await useFetch('/api/session')

const folders = ref<Array<{ name: string, count: number }>>([])

async function loadFolders() {
  try {
    const data = await $fetch<{ folders: Array<{ name: string, count: number }> }>('/api/folders')
    folders.value = data.folders
  } catch {
    folders.value = []
  }
}

onMounted(() => {
  if (session.value?.authenticated) {
    loadFolders()
  }
})

// Provide loadFolders to child components for refresh
provide('loadFolders', loadFolders)

const route = useRoute()

const mainNavItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Médiathèque',
    icon: 'i-lucide-image',
    to: '/',
    active: route.path === '/'
  }
])

const folderNavItems = computed<NavigationMenuItem[]>(() =>
  folders.value.map(folder => ({
    label: folder.name,
    icon: 'i-lucide-folder',
    badge: String(folder.count),
    to: `/folders/${folder.name}`,
    active: route.path === `/folders/${folder.name}`
  }))
)

async function handleLogout() {
  await $fetch('/api/logout', { method: 'POST' })
  navigateTo('/login')
}
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable :ui="{ footer: 'border-t border-default' }">
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2">
          <div class="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <UIcon name="i-lucide-zap" class="text-white size-4" />
          </div>
          <span v-if="!collapsed" class="font-semibold text-lg tracking-tight">SharpStore</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="mainNavItems"
          orientation="vertical"
        />

        <div v-if="!collapsed" class="px-3 pt-4 pb-1">
          <p class="text-xs font-semibold text-muted uppercase tracking-wider">Dossiers</p>
        </div>

        <UNavigationMenu
          v-if="folderNavItems.length > 0"
          :collapsed="collapsed"
          :items="folderNavItems"
          orientation="vertical"
        />

        <div v-else-if="!collapsed" class="px-3 py-2">
          <p class="text-sm text-muted">Aucun dossier</p>
        </div>
      </template>

      <template #footer="{ collapsed }">
        <div class="flex items-center justify-between w-full" :class="{ 'flex-col gap-2': collapsed }">
          <div class="flex items-center gap-2">
            <UAvatar :label="session?.username?.[0]?.toUpperCase() || 'A'" size="sm" />
            <span v-if="!collapsed" class="text-sm font-medium">{{ session?.username || 'Admin' }}</span>
          </div>
          <div class="flex items-center gap-1">
            <UColorModeButton v-if="!collapsed" size="xs" />
            <UButton
              icon="i-lucide-log-out"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="handleLogout"
            />
          </div>
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
