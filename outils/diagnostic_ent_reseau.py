"""Public networking probe only: no credentials, no ENT personal data."""
import ssl
import socket
import urllib.request
import urllib.error
from urllib.parse import urlparse

HOSTS = [
    ("sso-occitanie", "https://sso.mon-ent-occitanie.fr/oidc/.well-known"),
    ("cas-occitanie", "https://cas.mon-ent-occitanie.fr/"),
    ("educonnect", "https://educonnect.education.gouv.fr/"),
    ("api-skolengo", "https://api.skolengo.com/"),
]
for label, url in HOSTS:
    try:
        req = urllib.request.Request(
            url, headers={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36", "Accept":"application/json,text/html;q=0.8"})
        with urllib.request.urlopen(req, timeout=12, context=ssl.create_default_context()) as response:
            print("ENT_PROBE", label, "HTTP", response.status, "FINAL_HOST", urlparse(response.url).hostname)
    except urllib.error.HTTPError as exc:
        print("ENT_PROBE", label, "HTTP", exc.code)
    except urllib.error.URLError as exc:
        print("ENT_PROBE", label, "NETWORK_ERROR", type(exc.reason).__name__)
    except Exception as exc:
        print("ENT_PROBE", label, "ERROR", type(exc).__name__)
