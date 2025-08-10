# Use Debian-based Node so we can apt-get ffmpeg/python
FROM node:20-bullseye

# Set working dir
WORKDIR /app

# Install system deps (python3, pip, ffmpeg)
# Clean apt lists to reduce image size
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     python3 python3-pip ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install yt-dlp via pip (system-wide)
RUN pip3 install --no-cache-dir yt-dlp

# Copy package files first (leverage Docker cache)
COPY package.json yarn.lock ./

# Install node deps (install dev deps so we can build)
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Build the Nest app
RUN yarn build

# Create non-root user for runtime, change ownership
RUN useradd -m appuser && chown -R appuser /app
USER appuser

# Expose port (Render will provide PORT env)
EXPOSE 3000

# Start command: use the port from process.env.PORT in your main.ts
CMD ["node", "dist/main.js"]
