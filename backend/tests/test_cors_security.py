"""
Focused CORS Security Verification Suite for DHAAL GST Shield
Validates strict CORS hardening in accordance with Batch 5A:
1. Verified local development & preview origins are allowed (ports 3001 and 4173)
2. Production canonical origins are allowed
3. Untrusted external origins are strictly denied
4. Arbitrary *.vercel.app origins are strictly denied (no broad regex)
5. Preflight OPTIONS requests work cleanly for authorized endpoints and methods
6. Access-Control-Allow-Credentials header is strictly absent
7. Error responses do not reflect untrusted origins or credentials
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

VERIFIED_LOCAL_ORIGINS = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

PRODUCTION_ORIGINS = [
    "https://dhaal-gst-sheild.vercel.app",
    "https://dhaal-gst-shield-v2.vercel.app",
]

UNTRUSTED_ORIGINS = [
    "https://evil-attacker.com",
    "http://malicious-site.org",
    "https://arbitrary-project.vercel.app",
    "https://phishing.vercel.app",
    "https://dhaal-fake.vercel.app",
    "http://localhost:8080",
    "http://localhost:3000",
]


def test_verified_local_origins_allowed():
    """Verify that only the exact local development and preview origins receive CORS headers."""
    for origin in VERIFIED_LOCAL_ORIGINS:
        res = client.get("/api/explain/en", headers={"Origin": origin})
        assert res.status_code == 200
        assert res.headers.get("access-control-allow-origin") == origin, f"Origin {origin} should be allowed"
        assert res.headers.get("access-control-allow-credentials") is None, "Credentials must not be enabled"


def test_production_origins_allowed():
    """Verify that canonical production origins receive CORS headers."""
    for origin in PRODUCTION_ORIGINS:
        res = client.get("/api/explain/en", headers={"Origin": origin})
        assert res.status_code == 200
        assert res.headers.get("access-control-allow-origin") == origin, f"Origin {origin} should be allowed"
        assert res.headers.get("access-control-allow-credentials") is None, "Credentials must not be enabled"


def test_untrusted_external_origins_denied():
    """Verify that arbitrary external domains do not receive Access-Control-Allow-Origin headers."""
    for origin in UNTRUSTED_ORIGINS:
        res = client.get("/api/explain/en", headers={"Origin": origin})
        assert res.status_code == 200
        assert "access-control-allow-origin" not in res.headers, f"Untrusted origin {origin} must be denied"


def test_arbitrary_vercel_origins_denied():
    """Verify that arbitrary Vercel domains are denied because broad regex is removed."""
    arbitrary_vercel = [
        "https://my-other-app.vercel.app",
        "https://random-tenant.vercel.app",
        "https://dhaal-lookalike.vercel.app",
    ]
    for origin in arbitrary_vercel:
        res = client.get("/api/explain/en", headers={"Origin": origin})
        assert "access-control-allow-origin" not in res.headers, f"Origin {origin} must not be allowed"


def test_preflight_post_works_for_allowed_origin():
    """Verify that an OPTIONS preflight request succeeds with 200 and specifies allowed methods."""
    origin = "http://localhost:3001"
    res = client.options(
        "/api/verify/draft",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type, Accept",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == origin
    allowed_methods = res.headers.get("access-control-allow-methods", "")
    assert "POST" in allowed_methods
    assert "OPTIONS" in allowed_methods
    assert res.headers.get("access-control-allow-credentials") is None


def test_preflight_denied_for_untrusted_origin():
    """Verify that preflight OPTIONS requests from untrusted origins are not granted CORS headers."""
    res = client.options(
        "/api/verify/draft",
        headers={
            "Origin": "https://evil.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert "access-control-allow-origin" not in res.headers


def test_credentials_header_strictly_absent():
    """Verify that Access-Control-Allow-Credentials is never sent on API responses."""
    for origin in VERIFIED_LOCAL_ORIGINS + PRODUCTION_ORIGINS:
        res = client.get("/api", headers={"Origin": origin})
        assert res.headers.get("access-control-allow-credentials") is None


def test_error_responses_do_not_reflect_untrusted_origins():
    """Verify that 4xx validation errors and 5xx errors do not reflect untrusted origins."""
    untrusted = "https://untrusted-attacker.com"

    # 422 Unprocessable Entity
    res_422 = client.post(
        "/api/verify/draft",
        json={"invalid": "payload"},
        headers={"Origin": untrusted},
    )
    assert res_422.status_code == 422
    assert "access-control-allow-origin" not in res_422.headers
    assert res_422.headers.get("access-control-allow-credentials") is None

    # Allowed origin still gets proper CORS on error
    allowed = "http://localhost:3001"
    res_422_allowed = client.post(
        "/api/verify/draft",
        json={"invalid": "payload"},
        headers={"Origin": allowed},
    )
    assert res_422_allowed.status_code == 422
    assert res_422_allowed.headers.get("access-control-allow-origin") == allowed
    assert res_422_allowed.headers.get("access-control-allow-credentials") is None
