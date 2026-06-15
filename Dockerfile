# Use an official Node.js runtime as parent image
FROM node:20

# Create app directory
WORKDIR /app

# Copy package configuration
COPY package*.json ./

# Install project dependencies
RUN npm install

# Install the gemini CLI globally inside the container (matching your system setup)
RUN npm install -g @google/gemini-cli

# Copy all source files
COPY . .

# Build the static React dashboard so Express can serve it if requested
RUN npm run build

# Hugging Face Spaces run on port 7860 by default
ENV PORT=7860
EXPOSE 7860

# Start the Node.js application (runs Express & Telegraf bot)
CMD [ "npm", "start" ]
