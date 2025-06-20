# مرحلة البناء
FROM node:20-alpine AS builder

# تعيين مجلد العمل
WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت التبعيات
RUN npm ci --only=production

# نسخ الكود المصدري
COPY . .

# بناء التطبيق
RUN npm run build

# مرحلة الإنتاج
FROM nginx:alpine

# نسخ ملفات البناء
COPY --from=builder /app/dist /usr/share/nginx/html

# نسخ إعدادات Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# فتح المنفذ
EXPOSE 80

# تشغيل Nginx
CMD ["nginx", "-g", "daemon off;"]
