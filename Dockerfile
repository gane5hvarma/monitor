  
FROM node:10.16.0-alpine
RUN mkdir /app
ADD . /app
WORKDIR /app
CMD node index.js