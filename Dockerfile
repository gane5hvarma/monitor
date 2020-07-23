  
FROM node:10.16.0-alpine
RUN mkdir /app
ADD . /app
WORKDIR /app
RUN npm install
CMD node index.js