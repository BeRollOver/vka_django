#!/usr/bin/env python
"""
Command-line utility for administrative tasks.
"""
import pymysql
pymysql.install_as_MySQLdb()

import os
import sys

if __name__ == "__main__":
    os.environ.setdefault(
        "DJANGO_SETTINGS_MODULE",
        "vka_django.settings"
    )

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
