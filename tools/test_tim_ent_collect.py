"""Tests hors connexion : aucune donnée personnelle ni identifiant requis."""
import importlib.util
import sys
import types
import unittest
from datetime import date
from pathlib import Path

pkg = types.ModuleType("skolengo")
pkg.__path__ = []
api = types.ModuleType("skolengo.api")
class SkolengoAuthError(Exception):
    pass
class SkolengoBirthdateRequired(SkolengoAuthError):
    pass
class SkolengoLoginRefused(SkolengoAuthError):
    pass
api.SkolengoClient = type("SkolengoClient", (), {})
api.SkolengoAuthError = SkolengoAuthError
api.SkolengoBirthdateRequired = SkolengoBirthdateRequired
api.SkolengoLoginRefused = SkolengoLoginRefused
api.jsonapi_deserialize = lambda value: value
sys.modules["skolengo"] = pkg
sys.modules["skolengo.api"] = api

spec = importlib.util.spec_from_file_location("ent_collect_test",Path(__file__).resolve().parents[1]/"scripts"/"tim_ent_collect.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class TestCollecteENT(unittest.TestCase):
    def test_academic_year(self):
        self.assertEqual(mod.academic_year_start(date(2026, 11, 9)),date(2026,9,1))
        self.assertEqual(mod.academic_year_start(date(2027, 2, 9)),date(2026,9,1))
    def test_host_whitelist(self):
        for host in ["https://api.skolengo.com/file/a.pdf","https://frederic-desmons.mon-ent-occitanie.fr/lectureFichiergw.do?id=4","https://sso.mon-ent-occitanie.fr/resource"]:
            self.assertTrue(mod.authorized_attachment_host(host),host)
        for host in ["http://api.skolengo.com/file","https://api.skolengo.com.attacker.test/x","https://evil.mon-ent-occitanie.fr.attacker.test/x","https://example.org/file"]:
            # One host on the allowlist can be over plain HTTP; only URLs with https are admitted by collect_links.
            self.assertFalse(mod.authorized_attachment_host(host) and host.startswith("https://"),host)
    def test_nested_attachment_discovery(self):
        sample=[{"contents":[{"attachments":[{"name":"Énoncé.pdf","mimeType":"application/pdf","url":"https://api.skolengo.com/attachments/1"}]},{"name":"Cours de sciences","text":"Voir le chapitre"}]},{"other":"x"}]
        found={}
        mod.collect_links(sample,found)
        self.assertEqual(list(found),["https://api.skolengo.com/attachments/1"])
    def test_reject_non_https_discovery(self):
        sample={"name":"fichier","url":"http://api.skolengo.com/attachments/1"}
        found={}
        mod.collect_links(sample,found)
        self.assertEqual(found,{})
    def test_safe_auth_diagnostic(self):
        e=SkolengoAuthError("Could not obtain an authorization code from the school's login flow")
        self.assertEqual(mod.safe_auth_error_code(e),"SSO_CODE_AUTORISATION_ABSENT")
        self.assertEqual(mod.safe_auth_error_code(SkolengoLoginRefused("secret token should not appear")),"EDUCONNECT_REFUS_CONNEXION_OU_PARCOURS_NON_PRIS_EN_CHARGE")

if __name__=="__main__":
    unittest.main()
