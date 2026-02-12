<script setup lang="ts">
const props = withDefaults(defineProps<{
  path?: string
  title?: string
}>(), {
  path: '',
  title: 'Médiathèque'
})

const router = useRouter()
const toast = useToast()

// --------------- Data ---------------
const folders = ref<Array<{ name: string, path: string, count: number }>>([])
const images = ref<any[]>([])
const loading = ref(true)

// Pagination state
const route = useRoute()
const currentPage = computed(() => Number(route.query.page) || 1)
const itemsPerPage = ref(20)
const totalItems = ref(0)

const loadFolders = inject<() => Promise<void>>('loadFolders')

async function fetchData() {
  loading.value = true
  try {
    const [foldersData, imagesData] = await Promise.all([
      $fetch<{ folders: any[] }>('/api/folders', { query: { path: props.path } }),
      $fetch<{ images: any[], pagination: any }>('/api/images', {
        query: {
          path: props.path,
          page: currentPage.value,
          perPage: itemsPerPage.value
        }
      })
    ])
    folders.value = foldersData.folders || []
    images.value = imagesData.images || []
    totalItems.value = imagesData.pagination?.total || 0
  } catch {
    toast.add({
      title: 'Erreur',
      description: 'Impossible de charger le contenu.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    loading.value = false
  }
}

// Pagination link generator
function getPaginationRoute(page: number) {
  return {
    query: {
      ...route.query,
      page: page > 1 ? page : undefined
    }
  }
}

// Reload when path or page changes
watch([() => props.path, currentPage], fetchData, { immediate: true })

// --------------- Navigation ---------------
function navigateToFolder(folderPath: string) {
  router.push(`/folders/${folderPath}`)
}

// --------------- Create folder ---------------
const showNewFolderModal = ref(false)
const newFolderName = ref('')
const creatingFolder = ref(false)

async function createFolder() {
  if (!newFolderName.value.trim()) return

  creatingFolder.value = true
  try {
    await $fetch('/api/folders', {
      method: 'POST',
      body: { name: newFolderName.value.trim(), path: props.path }
    })

    toast.add({
      title: 'Dossier créé',
      description: `"${newFolderName.value}" créé avec succès.`,
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
    newFolderName.value = ''
    showNewFolderModal.value = false
    await fetchData()
    loadFolders?.()
  } catch (err: any) {
    toast.add({
      title: 'Erreur',
      description: err.data?.statusMessage || 'Impossible de créer le dossier',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    creatingFolder.value = false
  }
}

// --------------- Upload ---------------
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const formData = new FormData()
  formData.append('path', props.path)
  for (const file of input.files) {
    formData.append('files', file)
  }

  uploading.value = true
  try {
    await $fetch('/api/upload', { method: 'POST', body: formData })
    toast.add({
      title: 'Upload réussi',
      description: `${input.files.length} fichier(s) uploadé(s).`,
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
    await fetchData()
    loadFolders?.()
  } catch {
    toast.add({
      title: 'Erreur',
      description: 'Échec de l\'upload.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

// --------------- Image Deletion ---------------
const showDeleteConfirm = ref(false)
const imageToDelete = ref<any>(null)

function confirmDeleteImage(image: any) {
  imageToDelete.value = image
  showDeleteConfirm.value = true
}

async function deleteImage() {
  if (!imageToDelete.value) return
  try {
    await $fetch('/api/images', {
      method: 'DELETE',
      body: { filename: imageToDelete.value.filename, path: props.path }
    })
    toast.add({
      title: 'Supprimé',
      description: 'Image supprimée avec succès.',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
    showDeleteConfirm.value = false
    imageToDelete.value = null
    await fetchData()
    loadFolders?.()
  } catch {
    toast.add({
      title: 'Erreur',
      description: 'Impossible de supprimer l\'image.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="title" icon="i-lucide-image">
        <template #right>
          <slot name="actions" />
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*"
            class="hidden"
            @change="handleFileUpload"
          >
          <UButton
            label="Uploader"
            icon="i-lucide-upload"
            color="neutral"
            variant="subtle"
            size="sm"
            :loading="uploading"
            @click="triggerUpload"
          />
          <UButton
            label="Nouveau dossier"
            icon="i-lucide-folder-plus"
            size="sm"
            @click="showNewFolderModal = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-7xl mx-auto w-full">
        <!-- Breadcrumbs slot -->
        <div v-if="$slots.breadcrumbs" class="mb-6">
          <slot name="breadcrumbs" />
        </div>

        <!-- File Explorer -->
        <FileExplorer
          :current-path="path"
          :folders="folders"
          :images="images"
          :loading="loading"
          @navigate="navigateToFolder"
          @delete-image="confirmDeleteImage"
        />

        <!-- Pagination -->
        <div v-if="totalItems > itemsPerPage" class="mt-8 flex justify-center">
          <UPagination
            :page="currentPage"
            :total="totalItems"
            :items-per-page="itemsPerPage"
            :to="getPaginationRoute"
            show-edges
          />
        </div>

      </div>
    </template>
  </UDashboardPanel>

  <!-- New Folder Modal -->
  <UModal v-model:open="showNewFolderModal">
    <template #content>
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Nouveau dossier</h3>
        <form class="space-y-4" @submit.prevent="createFolder">
          <UFormField label="Nom du dossier" required>
            <UInput
              v-model="newFolderName"
              placeholder="ex: blog, thumbnails"
              icon="i-lucide-folder"
              class="w-full"
              autofocus
            />
          </UFormField>
          <p class="text-xs text-muted">
            Sera créé dans <strong>{{ path || 'racine' }}</strong>
          </p>
          <div class="flex justify-end gap-2 pt-2">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="showNewFolderModal = false" />
            <UButton type="submit" label="Créer" icon="i-lucide-plus" :loading="creatingFolder" :disabled="!newFolderName.trim()" />
          </div>
        </form>
      </div>
    </template>
  </UModal>

  <!-- Delete Confirmation Modal -->
  <UModal v-model:open="showDeleteConfirm">
    <template #content>
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-2">Supprimer l'image ?</h3>
        <p class="text-muted mb-4">
          L'image <strong>{{ imageToDelete?.filename }}</strong> et toutes ses variantes en cache seront supprimées. Cette action est irréversible.
        </p>
        <div class="flex justify-end gap-2">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="showDeleteConfirm = false" />
          <UButton label="Supprimer" color="error" icon="i-lucide-trash-2" @click="deleteImage" />
        </div>
      </div>
    </template>
  </UModal>
</template>
