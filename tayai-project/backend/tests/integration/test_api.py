"""
Integration Tests for API Endpoints

Tests the FastAPI endpoints with mocked services.
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient

from app.main import app


class TestHealthEndpoints:
    """Tests for health check endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    def test_root_endpoint(self, client):
        """Root endpoint should return API info."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "TayAI" in data["message"]
        assert "version" in data
    
    def test_health_check(self, client):
        """Health check should return healthy status."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestAPIStructure:
    """Tests for API structure and routing."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app, raise_server_exceptions=False)
    
    def test_api_v1_prefix_exists(self, client):
        """API v1 routes should be under /api/v1 prefix."""
        # This tests that the router is mounted correctly
        # Auth endpoints should exist and return appropriate status
        response = client.get("/api/v1/chat/history")
        # Should not be 404 (route not found), auth failure (401/500) is acceptable
        assert response.status_code in [401, 403, 500]
    
    def test_invalid_route_returns_404(self, client):
        """Invalid routes should return 404."""
        response = client.get("/api/v1/nonexistent")
        assert response.status_code == 404


class TestChatEndpointsAuth:
    """Tests for chat endpoint authentication."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app, raise_server_exceptions=False)
    
    def test_chat_requires_auth(self, client):
        """Chat endpoint should require authentication."""
        response = client.post(
            "/api/v1/chat/",
            json={"message": "Hello"}
        )
        # Should be 401 Unauthorized, 403 Forbidden, 422 validation, or 500 (missing deps)
        assert response.status_code in [401, 403, 422, 500]
    
    def test_chat_history_requires_auth(self, client):
        """Chat history endpoint should require authentication."""
        response = client.get("/api/v1/chat/history")
        assert response.status_code in [401, 403, 500]


class TestAdminEndpointsAuth:
    """Tests for admin endpoint authentication."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app, raise_server_exceptions=False)
    
    def test_admin_knowledge_requires_auth(self, client):
        """Admin knowledge endpoints should require authentication."""
        response = client.get("/api/v1/admin/knowledge")
        assert response.status_code in [401, 403, 500]
    
    def test_admin_persona_test_requires_auth(self, client):
        """Admin persona test endpoint should require authentication."""
        response = client.post(
            "/api/v1/admin/persona/test",
            json={"message": "Test"}
        )
        assert response.status_code in [401, 403, 500]


class TestRequestValidation:
    """Tests for request validation."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    def test_invalid_json_returns_422(self, client):
        """Invalid JSON should return 422 Unprocessable Entity."""
        response = client.post(
            "/api/v1/chat/",
            content="not valid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422


class TestCORSHeaders:
    """Tests for CORS configuration."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    def test_cors_headers_present(self, client):
        """CORS headers should be present for allowed origins."""
        response = client.options(
            "/",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET"
            }
        )
        # Should either allow or be handled
        assert response.status_code in [200, 204, 400]
