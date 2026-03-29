CREATE DATABASE IF NOT EXISTS eventzen_finance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON eventzen_finance.* TO 'finance_user'@'%';
FLUSH PRIVILEGES;
