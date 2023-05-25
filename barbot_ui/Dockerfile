# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Bundle app source
COPY . .

# Make port 3000 available to the outside world
EXPOSE 3000

# Build the app
RUN npm run build

# Serve the app
CMD [ "npx", "serve", "-s", "build" ]
