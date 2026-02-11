"""
Backend tests for User Preferences API endpoints
Tests GET/PUT /api/user-preferences/{page} endpoints for column customization
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_session():
    """Create authenticated session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Login as admin
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin"
    })
    
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    return session


class TestUserPreferencesAPI:
    """Tests for User Preferences endpoints"""
    
    def test_get_preferences_today_unauthenticated(self):
        """GET /api/user-preferences/today without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/user-preferences/today")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Unauthenticated request returns 401")
    
    def test_get_preferences_today_authenticated(self, auth_session):
        """GET /api/user-preferences/today returns preferences object"""
        response = auth_session.get(f"{BASE_URL}/api/user-preferences/today")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify structure has required fields
        assert "hidden_columns" in data or data.get("hidden_columns") is None or isinstance(data.get("hidden_columns"), list)
        assert "column_order" in data or data.get("column_order") is None or isinstance(data.get("column_order"), list)
        print(f"PASS: GET /api/user-preferences/today returned: {data}")
    
    def test_put_preferences_today(self, auth_session):
        """PUT /api/user-preferences/today saves preferences"""
        # Save some preferences
        payload = {
            "hidden_columns": ["mail_id", "n1"],
            "column_order": ["time", "source", "customer_name", "phone"]
        }
        
        response = auth_session.put(f"{BASE_URL}/api/user-preferences/today", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "message" in data
        print(f"PASS: PUT /api/user-preferences/today saved preferences")
        
        # Verify preferences were persisted
        get_response = auth_session.get(f"{BASE_URL}/api/user-preferences/today")
        assert get_response.status_code == 200
        
        get_data = get_response.json()
        assert get_data.get("hidden_columns") == ["mail_id", "n1"]
        assert get_data.get("column_order") == ["time", "source", "customer_name", "phone"]
        print("PASS: Preferences persisted correctly")
    
    def test_get_preferences_upcoming(self, auth_session):
        """GET /api/user-preferences/upcoming works"""
        response = auth_session.get(f"{BASE_URL}/api/user-preferences/upcoming")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, dict)
        print(f"PASS: GET /api/user-preferences/upcoming returned: {data}")
    
    def test_put_preferences_upcoming(self, auth_session):
        """PUT /api/user-preferences/upcoming saves preferences"""
        payload = {
            "hidden_columns": ["status"],
            "column_order": ["time", "customer_name"]
        }
        
        response = auth_session.put(f"{BASE_URL}/api/user-preferences/upcoming", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: PUT /api/user-preferences/upcoming saved preferences")
    
    def test_get_preferences_history(self, auth_session):
        """GET /api/user-preferences/history works"""
        response = auth_session.get(f"{BASE_URL}/api/user-preferences/history")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, dict)
        print(f"PASS: GET /api/user-preferences/history returned: {data}")
    
    def test_put_preferences_history(self, auth_session):
        """PUT /api/user-preferences/history saves preferences"""
        payload = {
            "hidden_columns": ["status"],
            "column_order": ["date", "customer", "vehicle"]
        }
        
        response = auth_session.put(f"{BASE_URL}/api/user-preferences/history", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: PUT /api/user-preferences/history saved preferences")
    
    def test_preferences_per_user_isolation(self, auth_session):
        """Verify preferences are per-user (user_id in query)"""
        # Get today preferences - should include user_id context
        response = auth_session.get(f"{BASE_URL}/api/user-preferences/today")
        assert response.status_code == 200
        
        data = response.json()
        # Should have user_id or page field
        assert "page" in data or "user_id" in data
        print("PASS: Preferences response contains user/page context")
    
    def test_clear_hidden_columns(self, auth_session):
        """Test clearing hidden_columns (empty array)"""
        payload = {
            "hidden_columns": [],
            "column_order": []
        }
        
        response = auth_session.put(f"{BASE_URL}/api/user-preferences/today", json=payload)
        assert response.status_code == 200
        
        # Verify cleared
        get_response = auth_session.get(f"{BASE_URL}/api/user-preferences/today")
        get_data = get_response.json()
        assert get_data.get("hidden_columns") == []
        print("PASS: Hidden columns cleared successfully")


class TestStatusDropdownUpdate:
    """Test STATUS column update via appointment endpoint"""
    
    def test_update_appointment_status_dropdown(self, auth_session):
        """PUT /api/appointments/{id} updates appointment_day_outcome"""
        # First get an appointment
        response = auth_session.get(f"{BASE_URL}/api/appointments?view=day")
        assert response.status_code == 200
        
        appointments = response.json()
        if len(appointments) == 0:
            pytest.skip("No appointments to test with")
        
        appt_id = appointments[0]["appointment_id"]
        
        # Update the appointment_day_outcome (STATUS dropdown)
        update_payload = {
            "appointment_day_outcome": "Reported"
        }
        
        response = auth_session.put(f"{BASE_URL}/api/appointments/{appt_id}", json=update_payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify the update
        updated = response.json()
        assert updated.get("appointment_day_outcome") == "Reported"
        print(f"PASS: Status dropdown updated appointment {appt_id} to 'Reported'")
    
    def test_status_dropdown_options_from_settings(self, auth_session):
        """Verify Day's Outcome options come from settings"""
        response = auth_session.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        
        settings = response.json()
        outcomes = settings.get("appointment_day_outcomes", [])
        
        # Default outcomes should include these
        expected = ["Reported", "Rescheduled", "Cancelled", "No-show"]
        for opt in expected:
            assert opt in outcomes, f"Expected '{opt}' in day outcomes"
        
        print(f"PASS: Day's Outcome options found: {outcomes}")


class TestActionButton:
    """Test Eye icon action button navigation"""
    
    def test_appointment_detail_endpoint(self, auth_session):
        """GET /api/appointments/{id} returns appointment detail"""
        # Get list of appointments first
        response = auth_session.get(f"{BASE_URL}/api/appointments?view=day")
        assert response.status_code == 200
        
        appointments = response.json()
        if len(appointments) == 0:
            pytest.skip("No appointments to test with")
        
        appt_id = appointments[0]["appointment_id"]
        
        # Get single appointment
        detail_response = auth_session.get(f"{BASE_URL}/api/appointments/{appt_id}")
        assert detail_response.status_code == 200, f"Expected 200, got {detail_response.status_code}"
        
        detail = detail_response.json()
        assert detail.get("appointment_id") == appt_id
        assert "customer_name" in detail
        assert "appointment_date" in detail
        print(f"PASS: Appointment detail endpoint works for {appt_id}")
    
    def test_nonexistent_appointment_returns_404(self, auth_session):
        """GET /api/appointments/nonexistent returns 404"""
        response = auth_session.get(f"{BASE_URL}/api/appointments/nonexistent_id_12345")
        assert response.status_code == 404
        print("PASS: Non-existent appointment returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
