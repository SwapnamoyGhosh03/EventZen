CREATE DATABASE IF NOT EXISTS eventzen_auth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON eventzen_auth.* TO 'auth_user'@'%';
FLUSH PRIVILEGES;
