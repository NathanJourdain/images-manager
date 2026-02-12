<script setup lang="ts">
definePageMeta({
  layout: false
})

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/login', {
      method: 'POST',
      body: { username: username.value, password: password.value }
    })
    navigateTo('/')
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Identifiants invalides'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-default">
    <!-- Background decorative elements -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
    </div>

    <div class="relative w-full max-w-md px-6">
      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center size-16 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/20">
          <UIcon name="i-lucide-zap" class="text-white size-8" />
        </div>
        <h1 class="text-3xl font-bold tracking-tight">SharpStore</h1>
        <p class="text-muted mt-2">Connectez-vous pour accéder au dashboard</p>
      </div>

      <!-- Login Card -->
      <UCard variant="outline">
        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Error Alert -->
          <div
            v-if="error"
            class="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm"
          >
            <UIcon name="i-lucide-alert-circle" class="size-4 shrink-0" />
            {{ error }}
          </div>

          <UFormField label="Nom d'utilisateur" required>
            <UInput
              v-model="username"
              placeholder="admin"
              icon="i-lucide-user"
              size="lg"
              class="w-full"
              autofocus
            />
          </UFormField>

          <UFormField label="Mot de passe" required>
            <UInput
              v-model="password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            label="Se connecter"
            icon="i-lucide-arrow-right"
            size="lg"
            block
            :loading="loading"
            trailing
          />
        </form>
      </UCard>

      <p class="text-center text-xs text-muted mt-6">
        Microservice d'optimisation d'images
      </p>
    </div>
  </div>
</template>
