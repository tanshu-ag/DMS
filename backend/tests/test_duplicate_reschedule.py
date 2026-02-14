"""
Backend API Tests for Duplicate Detection and Reschedule Feature
Tests the following endpoints:
- GET /api/appointments/duplicates/check - Duplicate detection (excludes past dates)
- PUT /api/appointments/{id} - Update appointment date (reschedule)
- GET /api/appointments?view=upcoming - Verify updated appointment appears
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://crm-appt-ui.preview.emergentagent.com').rstrip('/')


class TestDuplicateCheckAPI:
    """Tests for the duplicate check endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    
    def test_duplicate_check_by_phone_returns_future_only(self):
        """GET /api/appointments/duplicates/check?phone=9012345606 should return only today/future appointments"""
        response = self.session.get(f"{BASE_URL}/api/appointments/duplicates/check?phone=9012345606")
        assert response.status_code == 200, f"Duplicate check failed: {response.text}"
        data = response.json()
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        for apt in data:
            apt_date = apt.get('appointment_date', '')
            assert apt_date >= today, f"Duplicate check returned past appointment: {apt_date}"
            print(f"Found duplicate: {apt.get('customer_name')} - {apt_date}")
        
        print(f"Duplicate check returned {len(data)} future/today appointment(s)")
    
    def test_duplicate_check_returns_tanvi_mukherjee(self):
        """Duplicate check for phone 9012345606 should return Tanvi Mukherjee"""
        response = self.session.get(f"{BASE_URL}/api/appointments/duplicates/check?phone=9012345606")
        assert response.status_code == 200
        data = response.json()
        
        customer_names = [apt.get('customer_name') for apt in data]
        assert 'Tanvi Mukherjee' in customer_names, f"Tanvi Mukherjee not found. Found: {customer_names}"
        print("Tanvi Mukherjee found in duplicate check results")
    
    def test_duplicate_check_requires_auth(self):
        """Duplicate check without auth should return 401"""
        # Use a new session without login
        response = requests.get(f"{BASE_URL}/api/appointments/duplicates/check?phone=9012345606")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Duplicate check correctly requires authentication")


class TestAppointmentUpdateAPI:
    """Tests for updating appointment date (reschedule feature)"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert login_response.status_code == 200
    
    def test_update_appointment_date_success(self):
        """PUT /api/appointments/{id} should update appointment date"""
        # First get the appointment for Tanvi Mukherjee
        response = self.session.get(f"{BASE_URL}/api/appointments/duplicates/check?phone=9012345606")
        assert response.status_code == 200
        duplicates = response.json()
        
        tanvi_apt = None
        for apt in duplicates:
            if apt.get('customer_name') == 'Tanvi Mukherjee':
                tanvi_apt = apt
                break
        
        assert tanvi_apt is not None, "Tanvi Mukherjee appointment not found"
        appointment_id = tanvi_apt['appointment_id']
        original_date = tanvi_apt['appointment_date']
        print(f"Found appointment: {appointment_id}, original date: {original_date}")
        
        # Calculate new date (tomorrow + 7 days to ensure it's different and valid)
        tomorrow = datetime.now() + timedelta(days=1)
        new_date = (tomorrow + timedelta(days=7)).strftime("%Y-%m-%d")
        
        # Update the appointment date
        update_response = self.session.put(
            f"{BASE_URL}/api/appointments/{appointment_id}",
            json={"appointment_date": new_date}
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        # Verify the update
        updated_apt = update_response.json()
        assert updated_apt['appointment_date'] == new_date, f"Date not updated. Expected {new_date}, got {updated_apt['appointment_date']}"
        print(f"Date updated successfully from {original_date} to {new_date}")
        
        # Revert to original date for other tests
        revert_response = self.session.put(
            f"{BASE_URL}/api/appointments/{appointment_id}",
            json={"appointment_date": original_date}
        )
        assert revert_response.status_code == 200, "Revert failed"
        print(f"Reverted date back to {original_date}")
    
    def test_update_nonexistent_appointment_returns_404(self):
        """PUT /api/appointments/invalid_id should return 404"""
        response = self.session.put(
            f"{BASE_URL}/api/appointments/nonexistent_id_12345",
            json={"appointment_date": "2026-02-20"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Update of non-existent appointment correctly returns 404")
    
    def test_appointment_update_logged_in_activity(self):
        """Appointment date update should be logged in activity"""
        # Get appointment
        response = self.session.get(f"{BASE_URL}/api/appointments/duplicates/check?phone=9012345606")
        duplicates = response.json()
        
        tanvi_apt = None
        for apt in duplicates:
            if apt.get('customer_name') == 'Tanvi Mukherjee':
                tanvi_apt = apt
                break
        
        if tanvi_apt is None:
            pytest.skip("Tanvi Mukherjee appointment not found")
        
        appointment_id = tanvi_apt['appointment_id']
        
        # Update date
        new_date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
        self.session.put(
            f"{BASE_URL}/api/appointments/{appointment_id}",
            json={"appointment_date": new_date}
        )
        
        # Check activity log
        activity_response = self.session.get(f"{BASE_URL}/api/appointments/{appointment_id}/activity")
        assert activity_response.status_code == 200
        activities = activity_response.json()
        
        # Find date update activity
        date_update_found = False
        for activity in activities:
            if activity.get('field_changed') == 'appointment_date':
                date_update_found = True
                print(f"Activity logged: {activity['action']} - {activity['old_value']} -> {activity['new_value']}")
                break
        
        assert date_update_found, "Date update not found in activity log"
        
        # Revert for other tests
        original_date = tanvi_apt['appointment_date']
        self.session.put(
            f"{BASE_URL}/api/appointments/{appointment_id}",
            json={"appointment_date": original_date}
        )


class TestDataConsistency:
    """Tests for data consistency after appointment update"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert login_response.status_code == 200
    
    def test_updated_appointment_appears_in_correct_view(self):
        """After updating date, appointment should appear in correct date view"""
        # Get appointment
        response = self.session.get(f"{BASE_URL}/api/appointments/duplicates/check?phone=9012345606")
        duplicates = response.json()
        
        tanvi_apt = None
        for apt in duplicates:
            if apt.get('customer_name') == 'Tanvi Mukherjee':
                tanvi_apt = apt
                break
        
        if tanvi_apt is None:
            pytest.skip("Tanvi Mukherjee appointment not found")
        
        appointment_id = tanvi_apt['appointment_id']
        original_date = tanvi_apt['appointment_date']
        
        # Update to a specific future date
        new_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        update_response = self.session.put(
            f"{BASE_URL}/api/appointments/{appointment_id}",
            json={"appointment_date": new_date}
        )
        assert update_response.status_code == 200
        
        # Verify in upcoming view
        upcoming_response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming")
        assert upcoming_response.status_code == 200
        upcoming_data = upcoming_response.json()
        
        found_in_upcoming = False
        for apt in upcoming_data:
            if apt.get('appointment_id') == appointment_id:
                found_in_upcoming = True
                assert apt['appointment_date'] == new_date, f"Date mismatch in upcoming view"
                print(f"Appointment found in upcoming with correct date: {new_date}")
                break
        
        assert found_in_upcoming, "Updated appointment not found in upcoming view"
        
        # Revert for other tests
        self.session.put(
            f"{BASE_URL}/api/appointments/{appointment_id}",
            json={"appointment_date": original_date}
        )
        print(f"Test complete - appointment reverted to {original_date}")


class TestDateFormatValidation:
    """Tests for date format validation in frontend data"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert login_response.status_code == 200
    
    def test_appointment_date_format_is_iso(self):
        """Appointments should return date in YYYY-MM-DD format"""
        response = self.session.get(f"{BASE_URL}/api/appointments/duplicates/check?phone=9012345606")
        assert response.status_code == 200
        data = response.json()
        
        import re
        date_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}$')
        
        for apt in data:
            apt_date = apt.get('appointment_date', '')
            assert date_pattern.match(apt_date), f"Invalid date format: {apt_date}"
        
        print("All dates in YYYY-MM-DD format")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
