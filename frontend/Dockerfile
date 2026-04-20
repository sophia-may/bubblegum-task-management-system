# Stage 1: Build Angular sang HTML/CSS/JS thuần
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --configuration=production

# Stage 2: Dùng NGINX để chạy web
FROM nginx:alpine
# Copy file build của Angular (Lưu ý: từ Angular 17, thư mục build thường là dist/tên-project/browser)
COPY --from=build /app/dist/task-frontend/browser /usr/share/nginx/html
EXPOSE 80
# Cấu hình Nginx để hỗ trợ routing của Angular
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html index.htm; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf