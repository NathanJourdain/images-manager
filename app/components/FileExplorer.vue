<script setup lang="ts">
const props = defineProps<{
  currentPath: string
  folders: Array<{ name: string, path: string, count: number }>
  images: Array<{ filename: string, path: string, size: number, variants: number, url: string, createdAt: string }>
  loading: boolean
}>()

const emit = defineEmits<{
  navigate: [path: string]
  'delete-image': [image: any]
  'copy-url': [image: any]
  preview: [image: any]
}>()

const toast = useToast()

// Modal state
const showImageModal = ref(false)
const selectedImage = ref<any>(null)
const route = useRoute()
const router = useRouter()

function openImageModal(image: any) {
  selectedImage.value = image
  showImageModal.value = true
  router.replace({ query: route.query, hash: `#i-${image.filename}` })
}

watch(showImageModal, (isOpen) => {
  if (!isOpen && route.hash.startsWith('#i-')) {
    router.replace({ query: route.query, hash: '' })
  }
})

// Deep link handling
watch([() => props.images, () => route.hash], ([images, hash]) => {
  if (hash.startsWith('#i-')) {
    const filename = hash.replace('#i-', '')
    const image = images.find(img => img.filename === filename)
    if (image && selectedImage.value?.filename !== filename) {
      selectedImage.value = image
      showImageModal.value = true
      
      // Scroll to image after a short delay to ensure DOM is ready
      nextTick(() => {
        const el = document.getElementById(`img-${filename}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
    }
  } else if (showImageModal.value) {
    showImageModal.value = false
  }
}, { immediate: true })

function getThumbUrl(image: any) {
  return `${image.url}?w=400&h=300&fit=cover`
}

function getPreviewUrl(image: any) {
  return `${image.url}?w=800&h=600&fit=inside`
}

function getPublicUrl(image: any) {
  return `${window.location.origin}${image.url}`
}

function copyPublicUrl(image: any) {
  const url = getPublicUrl(image)
  navigator.clipboard.writeText(url)
  toast.add({
    title: 'Copié !',
    description: 'Le lien public a été copié dans le presse-papier.',
    icon: 'i-lucide-check-circle',
    color: 'success'
  })
}

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getExtension(filename: string) {
  return filename.split('.').pop()?.toUpperCase() || ''
}
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="flex items-center justify-center py-20">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
  </div>

  <!-- Empty state -->
  <div v-else-if="folders.length === 0 && images.length === 0" class="text-center py-20">
    <div class="size-20 rounded-2xl bg-muted/10 flex items-center justify-center mx-auto mb-4">
      <UIcon name="i-lucide-folder-open" class="text-muted size-10" />
    </div>
    <h3 class="text-lg font-semibold mb-1">Dossier vide</h3>
    <p class="text-muted">Commencez par créer un sous-dossier ou uploader des images.</p>
  </div>

  <!-- Content Grid -->
  <div v-else>
    <!-- Folders grid -->
    <div v-if="folders.length > 0" class="mb-8">
      <h3 class="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Dossiers</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <UCard
          v-for="folder in folders"
          :key="folder.path"
          class="cursor-pointer group hover:ring-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
          @click="emit('navigate', folder.path)"
        >
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
              <UIcon name="i-lucide-folder" class="text-primary size-5" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">{{ folder.name }}</p>
              <p class="text-sm text-muted">
                {{ folder.count === 0 ? 'Vide' : `${folder.count} élément${folder.count > 1 ? 's' : ''}` }}
              </p>
            </div>
            <UIcon name="i-lucide-chevron-right" class="text-muted size-4 group-hover:text-primary transition-colors shrink-0" />
          </div>
        </UCard>
      </div>
    </div>

    <!-- Images grid -->
    <div v-if="images.length > 0">
      <h3 class="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Images</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">

        <div
          v-for="image in images"
          :id="`img-${image.filename}`"
          :key="image.filename"
        >
          <UPageCard
            :title="image.filename"
            :description="formatSize(image.size) + ' • ' + image.variants + ' variant' + (image.variants > 1 ? 's' : '')"
            orientation="vertical"
            reverse
            icon="i-lucide-image"
            class="cursor-pointer h-full"
            @click="openImageModal(image)"
          >
            <img :src="getThumbUrl(image)" :alt="image.filename" class="w-full aspect-[4/3] object-contain" />
            <template #footer>
              <UButton
                label="Supprimer"
                icon="i-lucide-trash"
                color="error"
                variant="subtle"
                size="sm"
                @click.stop="emit('delete-image', image)"
              />
            </template>
          </UPageCard>
        </div>
      </div>
    </div>
  </div>

  <!-- Image Details Modal -->
  <UModal v-model:open="showImageModal" scrollable>
    <template #content>
      <div v-if="selectedImage" class="p-0">
        <!-- Image preview -->
        <div class="bg-[var(--ui-bg-muted)] flex items-center justify-center rounded-t-lg overflow-hidden">
          <img
            :src="getPreviewUrl(selectedImage)"
            :alt="selectedImage.filename"
            class="max-h-96 w-full object-contain"
          />
        </div>

        <!-- Details -->
        <div class="p-6 space-y-5">
          <!-- Title -->
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-image" class="text-primary size-5" />
            </div>
            <div class="min-w-0">
              <h3 class="text-lg font-semibold truncate">{{ selectedImage.filename }}</h3>
              <p class="text-sm text-muted">{{ getExtension(selectedImage.filename) }} • {{ formatSize(selectedImage.size) }}</p>
            </div>
          </div>

          <!-- Info grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-xs font-semibold text-muted uppercase tracking-wider">Dossier</p>
              <p class="text-sm font-medium">{{ selectedImage.path || 'Racine' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-semibold text-muted uppercase tracking-wider">Taille</p>
              <p class="text-sm font-medium">{{ formatSize(selectedImage.size) }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-semibold text-muted uppercase tracking-wider">Créée le</p>
              <p class="text-sm font-medium">{{ formatDate(selectedImage.createdAt) }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-semibold text-muted uppercase tracking-wider">Variantes en cache</p>
              <p class="text-sm font-medium">{{ selectedImage.variants }}</p>
            </div>
          </div>

          <!-- Public URL -->
          <div class="space-y-2">
            <p class="text-xs font-semibold text-muted uppercase tracking-wider">Lien public</p>
            <div class="flex items-center gap-2">
              <UInput
                :model-value="getPublicUrl(selectedImage)"
                readonly
                icon="i-lucide-link"
                class="flex-1"
                :ui="{ base: 'font-mono text-xs' }"
              />
              <UButton
                icon="i-lucide-copy"
                color="neutral"
                variant="subtle"
                size="md"
                @click="copyPublicUrl(selectedImage)"
              />
            </div>
            <p class="text-xs text-muted">
              Ce lien est accessible publiquement. Ajoutez des paramètres pour transformer l'image :
              <code class="text-xs bg-[var(--ui-bg-muted)] px-1 py-0.5 rounded">?w=800&h=600&fit=cover&fm=webp</code>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between pt-2 border-t border-[var(--ui-border)]">
            <UButton
              label="Ouvrir l'image"
              icon="i-lucide-external-link"
              color="neutral"
              variant="ghost"
              size="sm"
              :to="selectedImage.url"
              target="_blank"
            />
            <div class="flex gap-2">
              <UButton
                label="Fermer"
                color="neutral"
                variant="outline"
                size="sm"
                @click="showImageModal = false"
              />
              <UButton
                label="Supprimer"
                icon="i-lucide-trash"
                color="error"
                variant="subtle"
                size="sm"
                @click="showImageModal = false; emit('delete-image', selectedImage)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
