from unittest.mock import patch

from django.test import SimpleTestCase

from config import settings


class DatabaseConfigTest(SimpleTestCase):
    def test_production_database_url_requires_tls_by_default(self) -> None:
        production_env = settings.env.model_copy(
            update={
                "DATABASE_URL": "postgresql://user:password@db.example.com/store",
                "POSTGRES_URL": "",
                "POSTGRES_SSLMODE": "",
                "DJANGO_DEBUG": False,
            }
        )

        with patch.object(settings, "env", production_env):
            config = settings.build_database_config()

        options = config.get("OPTIONS")
        self.assertIsInstance(options, dict)
        if not isinstance(options, dict):
            self.fail("Database OPTIONS must be a dictionary")
        self.assertEqual(options.get("sslmode"), "require")

    def test_development_database_does_not_force_tls(self) -> None:
        development_env = settings.env.model_copy(
            update={
                "DATABASE_URL": "postgresql://user:password@localhost/store",
                "POSTGRES_URL": "",
                "POSTGRES_SSLMODE": "",
                "DJANGO_DEBUG": True,
            }
        )

        with patch.object(settings, "env", development_env):
            config = settings.build_database_config()

        options = config.get("OPTIONS")
        self.assertIsInstance(options, dict)
        if not isinstance(options, dict):
            self.fail("Database OPTIONS must be a dictionary")
        self.assertNotIn("sslmode", options)

    def test_database_url_sslmode_overrides_production_default(self) -> None:
        production_env = settings.env.model_copy(
            update={
                "DATABASE_URL": (
                    "postgresql://user:password@db.example.com/store?sslmode=verify-full"
                ),
                "POSTGRES_URL": "",
                "POSTGRES_SSLMODE": "",
                "DJANGO_DEBUG": False,
            }
        )

        with patch.object(settings, "env", production_env):
            config = settings.build_database_config()

        options = config.get("OPTIONS")
        self.assertIsInstance(options, dict)
        if not isinstance(options, dict):
            self.fail("Database OPTIONS must be a dictionary")
        self.assertEqual(options.get("sslmode"), "verify-full")
