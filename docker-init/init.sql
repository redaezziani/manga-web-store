-- Grant all privileges to manga_user including CREATE database permission
GRANT ALL PRIVILEGES ON *.* TO 'manga_user'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
