from django.conf import settings
from django.contrib.staticfiles.management.commands.runserver import (
    Command as StaticfilesRunserverCommand,
)


class Command(StaticfilesRunserverCommand):
    def inner_run(self, *args, **options):
        self._print_shortcuts()
        return super().inner_run(*args, **options)

    def _print_shortcuts(self) -> None:
        base_url = self._build_base_url()
        admin_url = self._join_url(base_url, "admin/")
        docs_path = settings.DOCS_PATH
        redoc_path = settings.REDOC_PATH

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Useful links:"))
        if docs_path:
            docs_line = self._join_url(base_url, docs_path)
            self.stdout.write(f"  {docs_line}")
        if redoc_path:
            redoc_line = self._join_url(base_url, redoc_path)
            self.stdout.write(f"  Redoc:   {redoc_line}")
        self.stdout.write(f"  Admin:   {admin_url}")
        self.stdout.write(f"  API:     {base_url}")
        self.stdout.write("")

    def _build_base_url(self) -> str:
        host = getattr(self, "addr", None) or "127.0.0.1"
        port = getattr(self, "port", None) or "8000"

        if ":" in host and not host.startswith("["):
            host_display = f"[{host}]"
        else:
            host_display = host

        return f"http://{host_display}:{port}/"

    @staticmethod
    def _join_url(base: str, path: str) -> str:
        if not base.endswith("/"):
            base = f"{base}/"

        normalized_path = path.lstrip("/")
        return f"{base}{normalized_path}"
