FROM node:18-alpine

WORKDIR /app
COPY ./frontend /app
RUN npm i -g serve
EXPOSE 3000
CMD ["serve", "public", "-l", "3000"]
