# Use nginx alpine for a lightweight image
FROM nginx:alpine

# Copy application files to nginx html directory
COPY index.html /usr/share/nginx/html/
COPY piano.js /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/

# Copy nginx configuration if needed
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
