kill $(ps aux | grep '[n]ginx' | awk '{print $2}')
exec /usr/local/nginx/sbin/nginx
