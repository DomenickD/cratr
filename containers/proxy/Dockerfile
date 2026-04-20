FROM nginx:stable-alpine

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 5432

CMD ["nginx", "-g", "daemon off;"]
