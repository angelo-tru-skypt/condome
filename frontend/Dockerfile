FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ .

ENV VITE_API_URL=http://odoo:8069

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
