FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy all other project files
COPY . .

# Expose port (as defined in server.js/env)
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
