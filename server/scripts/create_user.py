import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

import envfile  # noqa: E402

envfile.load()

from src.common import db, security  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description="Crear usuario de Settflix")
    parser.add_argument("username")
    parser.add_argument("password")
    parser.add_argument("--email", default="")
    parser.add_argument("--superuser", action="store_true")
    args = parser.parse_args()

    if len(args.password) < 8:
        sys.exit("La contraseña debe tener al menos 8 caracteres.")

    flag = 1 if args.superuser else 0
    rowcount, _ = db.execute(
        "INSERT INTO auth_user (password, is_superuser, username, first_name, last_name, "
        "email, is_staff, is_active, date_joined) "
        "VALUES (%s, %s, %s, '', '', %s, %s, 1, UTC_TIMESTAMP(6)) "
        "ON DUPLICATE KEY UPDATE password = VALUES(password), email = VALUES(email)",
        (security.make_password(args.password), flag, args.username, args.email, flag),
    )
    # MySQL devuelve 1 si insertó, 2 si actualizó una fila existente.
    print(f"Usuario '{args.username}' {'creado' if rowcount == 1 else 'actualizado'}.")


if __name__ == "__main__":
    main()
