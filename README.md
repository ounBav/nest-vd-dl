# Video Downloader Service

A lightweight NestJS service for downloading videos from supported platforms, storing them locally, and delivering results to Telegram users.

## Features

- REST endpoints for video download requests
- Telegram bot integration with background download processing
- yt-dlp-based video downloads with safe local storage
- Validation using DTOs and Nest validation pipes
- Global exception handling and structured logging
- Rate limiting and security middleware
- Scheduled cleanup of stale download files
- Health endpoint and production-ready Docker setup

## Environment configuration

Copy `.env.example` to `.env` and update the values.

```bash
cp .env.example .env
```

Required environment variables:

- `PORT` - application port
- `TELEGRAM_BOT_TOKEN` - Telegram bot API token
- `DOWNLOADS_PATH` - local directory for temporary downloads
- `FILE_MAX_AGE_HOURS` - cleanup threshold for temporary files
- `CORS_ORIGIN` - allowed origin for CORS
- `NODE_ENV` - runtime environment

## Local setup

Install dependencies:

```bash
npm install
```

Run in development mode:

```bash
npm run start:dev
```

Build for production:

```bash
npm run build
npm run start:prod
```

## API documentation

The API docs are available at:

```text
http://localhost:3001/api/docs
```

## Health endpoint

Check the application health at:

```text
http://localhost:3001/health
```

## Docker

This repository includes a production-ready Dockerfile that installs system dependencies, Python, ffmpeg, and `yt-dlp`.

Build the image:

```bash
docker build -t nest-vd-dl .
```

Run the container:

```bash
docker run -d -p 3001:3001 \
  -e TELEGRAM_BOT_TOKEN=your_token_here \
  -e DOWNLOADS_PATH=/app/downloads \
  -e FILE_MAX_AGE_HOURS=24 \
  nest-vd-dl
```

Use Docker Compose:

```bash
docker-compose up -d
```

## Telegram bot usage

Send a supported video URL directly to the bot. The service queues downloads and replies when the file is ready.

## Testing

Run unit tests:

```bash
npm test
```

Run end-to-end tests:

```bash
npm run test:e2e
```

## CI

A GitHub Actions workflow is included at `.github/workflows/ci.yml` to install dependencies, build the app, and run tests on push or pull requests.

## Notes

- The app uses `helmet`, `compression`, `@nestjs/throttler`, and `nest-winston` for security and logging.
- Downloaded files are stored in `DOWNLOADS_PATH` and cleaned up automatically.
- `yt-dlp` must be available in the runtime environment; the Dockerfile installs it automatically.

## License

This project is released under an open-source license.
