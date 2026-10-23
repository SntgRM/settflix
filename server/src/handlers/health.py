
from src.common import db
from src.common.api import endpoint, response


@endpoint()
def handler(req):
    db.fetch_one("SELECT 1 AS ok")
    return response(200, {"status": "ok"})
