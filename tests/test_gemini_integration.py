import os
import pytest

from core.ai.gemini_wrapper import GeminiClient


@pytest.mark.skipif(not (os.environ.get("USE_REAL_GEMINI") in ("1", "true", "True") and os.environ.get("GEMINI_API_KEY")), reason="Real Gemini not enabled or API key missing")
def test_gemini_integration_smoke():
    client = GeminiClient()
    resp = client.generate("Say hello in two words")
    assert isinstance(resp, str)
    assert len(resp) > 0
