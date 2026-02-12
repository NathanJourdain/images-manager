# Images Manager

A self-hosted, high-performance image management system built with Nuxt, Sharp, and Nuxt UI. It provides an intuitive interface for uploading, organizing, and transforming images with on-the-fly processing.

## Features

- **On-the-fly Processing**: Resize, crop, and convert images (WebP, AVIF, etc.) via simple URL parameters.
- **Smart Caching**: Processed variants are cached for maximum performance.
- **Folder Management**: Organize your library into nested directories.
- **Deep Linking**: Share specific images with URL hashes that automatically open the modal and scroll to the item.
- **Docker Ready**: Designed to be integrated easily into any microservices architecture.

## Setup with Docker Compose

To integrate **Images Manager** into your own stack, use the following `docker-compose.yml` pattern to share the storage volume between your main application and the manager.

```yaml
services:
  images-manager:
    image: images-manager:latest
    ports:
      - "3000:3000"
    volumes:
      - uploads:/app/storage/originals
    environment:
      - PORT=3000
    restart: always

  my-web-app:
    build: .
    ports:
      - "8080:80"
    volumes:
      - uploads:/app/public/uploads
    depends_on:
      - images-manager
    restart: unless-stopped

volumes:
  uploads:
```

### Usage

1. **Access the UI**: Open `http://localhost:3000` to manage your images.
2. **Transform Images**: Use the `/render` route to get transformed versions:
   `http://localhost:3000/render/folder/image.jpg?w=800&h=600&fit=cover&fm=webp`