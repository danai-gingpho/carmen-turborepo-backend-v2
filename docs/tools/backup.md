# Backup database

``` batch

pg_dump --verbose --host=dev.blueledgers.com --port=6432 --username=developer --dbname=postgres --data-only > blueledgers.backup.sql

```

``` batch

/usr/local/bin/python3 convert-copy-to-insert.py

```
