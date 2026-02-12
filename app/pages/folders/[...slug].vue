<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()

// --------------- Path management ---------------
const currentPath = computed(() => {
  const slug = route.params.slug
  if (Array.isArray(slug)) return slug.join('/')
  return slug || ''
})

// --------------- Breadcrumbs ---------------
const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    { label: 'Médiathèque', icon: 'i-lucide-image', to: '/' }
  ]

  const parts = currentPath.value.split('/').filter(Boolean)
  let accumulated = ''

  parts.forEach((part, index) => {
    accumulated += (index > 0 ? '/' : '') + part
    items.push({
      label: part,
      icon: 'i-lucide-folder',
      to: `/folders/${accumulated}`
    })
  })

  return items
})
</script>

<template>
  <FileManager :path="currentPath">
    <template #breadcrumbs>
      <UBreadcrumb :items="breadcrumbItems" />
    </template>
  </FileManager>
</template>

