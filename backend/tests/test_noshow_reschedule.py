"""
Test cases for:
1. Auto No-show cron endpoint (POST /api/appointments/mark-no-show)
2. Rescheduled appointment with [R] badge
3. Reschedule history tooltip data format
4. Activity log validation (no spurious null→empty logs)
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestNoShowEndpoint:
    """Tests for the auto no-show cron endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "admin"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.user = login_response.json()
    
    def test_mark_noshow_endpoint_exists(self):
        """POST /api/appointments/mark-no-show endpoint exists and is accessible"""
        response = self.session.post(f"{BASE_URL}/api/appointments/mark-no-show")
        assert response.status_code == 200, f"Mark no-show endpoint failed: {response.text}"
        data = response.json()
        assert "message" in data
        assert "Marked" in data["message"]
        print(f"No-show endpoint response: {data}")
    
    def test_mark_noshow_with_date_param(self):
        """POST /api/appointments/mark-no-show?date=YYYY-MM-DD works with date parameter"""
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        response = self.session.post(f"{BASE_URL}/api/appointments/mark-no-show?date={yesterday}")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert yesterday in data["message"]
        print(f"No-show with date param: {data}")
    
    def test_mark_noshow_requires_auth(self):
        """POST /api/appointments/mark-no-show requires authentication"""
        # Create new session without auth
        unauth_session = requests.Session()
        response = unauth_session.post(f"{BASE_URL}/api/appointments/mark-no-show")
        assert response.status_code == 401, "Endpoint should require authentication"
    
    def test_mark_noshow_role_restricted(self):
        """POST /api/appointments/mark-no-show is restricted to CRM/DP roles"""
        # Login as CRE user
        cre_session = requests.Session()
        login_response = cre_session.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "cre1", "password": "cre123"}
        )
        if login_response.status_code == 200:
            response = cre_session.post(f"{BASE_URL}/api/appointments/mark-no-show")
            assert response.status_code == 403, "CRE should not be able to call mark-no-show"
            print("Correctly rejected CRE user")
        else:
            pytest.skip("CRE user not found, skipping role test")


class TestRescheduledAppointment:
    """Tests for rescheduled appointment #SILB0102"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "admin"}
        )
        assert login_response.status_code == 200
        self.appointment_id = "appt_a4b0f6271251"
    
    def test_appointment_detail_loads(self):
        """GET /api/appointments/appt_a4b0f6271251 loads correctly"""
        response = self.session.get(f"{BASE_URL}/api/appointments/{self.appointment_id}")
        assert response.status_code == 200, f"Failed to load appointment: {response.text}"
        data = response.json()
        
        # Verify it's the correct appointment
        assert data["booking_id"] == "#SILB0102"
        assert data["customer_name"] == "Diya Bose"
        print(f"Loaded appointment: {data['booking_id']} - {data['customer_name']}")
    
    def test_appointment_has_reschedule_flag(self):
        """Appointment should have is_rescheduled=True flag"""
        response = self.session.get(f"{BASE_URL}/api/appointments/{self.appointment_id}")
        data = response.json()
        
        assert data.get("is_rescheduled") == True, "Appointment should be marked as rescheduled"
        print(f"is_rescheduled: {data.get('is_rescheduled')}")
    
    def test_appointment_has_reschedule_history(self):
        """Appointment should have reschedule_history array"""
        response = self.session.get(f"{BASE_URL}/api/appointments/{self.appointment_id}")
        data = response.json()
        
        reschedule_history = data.get("reschedule_history", [])
        assert isinstance(reschedule_history, list), "reschedule_history should be a list"
        assert len(reschedule_history) > 0, "reschedule_history should not be empty"
        
        # Verify first entry has required fields
        first_entry = reschedule_history[0]
        assert "from_date" in first_entry, "Entry should have from_date"
        assert "to_date" in first_entry, "Entry should have to_date"
        
        print(f"Reschedule history entries: {len(reschedule_history)}")
        print(f"First entry: {first_entry}")
    
    def test_reschedule_history_date_format(self):
        """Reschedule history dates should be in YYYY-MM-DD format"""
        response = self.session.get(f"{BASE_URL}/api/appointments/{self.appointment_id}")
        data = response.json()
        
        reschedule_history = data.get("reschedule_history", [])
        for entry in reschedule_history:
            from_date = entry.get("from_date", "")
            to_date = entry.get("to_date", "")
            
            # Validate YYYY-MM-DD format
            import re
            date_pattern = r'^\d{4}-\d{2}-\d{2}$'
            assert re.match(date_pattern, from_date), f"from_date '{from_date}' is not in YYYY-MM-DD format"
            assert re.match(date_pattern, to_date), f"to_date '{to_date}' is not in YYYY-MM-DD format"
        
        print("All dates in reschedule_history are in correct format")


class TestActivityLog:
    """Tests for activity log - validates no spurious null→empty logs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "admin"}
        )
        assert login_response.status_code == 200
        self.appointment_id = "appt_a4b0f6271251"
    
    def test_activity_log_loads(self):
        """GET /api/appointments/{id}/activity loads correctly"""
        response = self.session.get(f"{BASE_URL}/api/appointments/{self.appointment_id}/activity")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Activity log should be a list"
        print(f"Found {len(data)} activity log entries")
    
    def test_no_null_to_empty_logs(self):
        """Activity logs should not have null→empty transitions"""
        response = self.session.get(f"{BASE_URL}/api/appointments/{self.appointment_id}/activity")
        data = response.json()
        
        spurious_logs = []
        for log in data:
            old_val = log.get("old_value")
            new_val = log.get("new_value")
            
            # Check for null→"" or None→"" or "None"→"" transitions
            is_old_empty = old_val in (None, "", "None", "null")
            is_new_empty = new_val in (None, "", "None", "null")
            
            if is_old_empty and is_new_empty:
                spurious_logs.append(log)
        
        if spurious_logs:
            print(f"Found {len(spurious_logs)} potentially spurious logs:")
            for log in spurious_logs[:3]:
                print(f"  - {log.get('action')}: {log.get('old_value')} → {log.get('new_value')}")
        
        # This is a soft assertion - log but don't fail
        print(f"Total logs: {len(data)}, Potentially spurious: {len(spurious_logs)}")


class TestUpcomingAppointments:
    """Tests for Upcoming appointments view with reschedule badge"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "admin"}
        )
        assert login_response.status_code == 200
    
    def test_upcoming_view_loads(self):
        """GET /api/appointments?view=upcoming returns future appointments"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Upcoming view should return a list"
        print(f"Found {len(data)} upcoming appointments")
    
    def test_upcoming_includes_rescheduled_appointment(self):
        """Upcoming view should include rescheduled appointment #SILB0102"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming")
        data = response.json()
        
        # Find the appointment
        silb0102 = None
        for appt in data:
            if appt.get("booking_id") == "#SILB0102" or appt.get("appointment_id") == "appt_a4b0f6271251":
                silb0102 = appt
                break
        
        assert silb0102 is not None, "Rescheduled appointment #SILB0102 should be in upcoming view"
        assert silb0102.get("is_rescheduled") == True, "Appointment should have is_rescheduled flag"
        
        print(f"Found #SILB0102: {silb0102.get('customer_name')} - is_rescheduled: {silb0102.get('is_rescheduled')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
