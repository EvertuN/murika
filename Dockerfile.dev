FROM php:8.1-apache

# Instalar extensões necessárias
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Habilitar módulos do Apache
RUN a2enmod rewrite

# Permitir .htaccess controlar configurações
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf

# Copiar código para o Apache
COPY . /var/www/html/

# Dar permissões
RUN chown -R www-data:www-data /var/www/html
