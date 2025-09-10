# Use an official Node.js image as the base for the frontend
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the frontend app
CMD ["npm", "run", "dev"]