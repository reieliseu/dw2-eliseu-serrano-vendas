FROM node:18-alpine

WORKDIR /app/frontend

COPY ./frontend /app/frontend

# Optional: install a static server for production preview
RUN npm i -g serve

EXPOSE 3000

CMD ["serve", "-s", "public/html", "-l", "3000"]
