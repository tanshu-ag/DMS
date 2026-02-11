"""
Backend API Tests for Upcoming page functionality
Tests the new view=upcoming endpoint and verifies:
- GET /api/appointments?view=upcoming returns only future appointments (not today)
- Correct date grouping across 3 future dates
- 12 total upcoming appointments
- Correct data structure with upcoming_status field
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://duplicate-reschedule.preview.emergentagent.com').rstrip('/')


class TestUpcomingAPI:
    """Tests for the new Upcoming page backend functionality"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    
    def test_upcoming_view_returns_future_appointments_only(self):
        """GET /api/appointments?view=upcoming should return only future appointments (not today)"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming")
        assert response.status_code == 200
        data = response.json()
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        for apt in data:
            apt_date = apt['appointment_date']
            assert apt_date > today, f"Upcoming view returned today's or past appointment: {apt_date}"
        
        print(f"All {len(data)} appointments are future dates (after today: {today})")
    
    def test_upcoming_returns_12_appointments(self):
        """GET /api/appointments?view=upcoming should return 12 appointments"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 12, f"Expected 12 upcoming appointments, got {len(data)}"
        print(f"Correct count: {len(data)} upcoming appointments")
    
    def test_upcoming_spans_3_dates(self):
        """Upcoming appointments should be grouped across 3 different future dates"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming")
        assert response.status_code == 200
        data = response.json()
        
        dates = set(apt['appointment_date'] for apt in data)
        assert len(dates) == 3, f"Expected 3 unique dates, got {len(dates)}: {sorted(dates)}"
        
        print(f"Appointments span 3 dates: {sorted(dates)}")
    
    def test_date_distribution_5_4_3(self):
        """Tomorrow: 5, Day after: 4, Day+3: 3 appointments"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming")
        data = response.json()
        
        # Group by date
        by_date = {}
        for apt in data:
            date = apt['appointment_date']
            by_date[date] = by_date.get(date, 0) + 1
        
        counts = sorted(by_date.values(), reverse=True)
        expected = [5, 4, 3]
        
        assert counts == expected, f"Expected distribution {expected}, got {counts}"
        print(f"Date distribution correct: {by_date}")
    
    def test_upcoming_has_upcoming_status_field(self):
        """Upcoming appointments should have 'upcoming_status' field (not appointment_status for display)"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming")
        data = response.json()
        
        for apt in data:
            assert 'upcoming_status' in apt, f"Missing upcoming_status in {apt.get('appointment_id')}"
        
        print("All appointments have upcoming_status field")
    
    def test_upcoming_has_all_required_fields_for_16_columns(self):
        """Verify upcoming appointments have all required fields for 16-column table"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming")
        data = response.json()
        
        # Required fields for the 16-column table (Upcoming variant)
        required_fields = [
            'appointment_time',      # Time
            'source',                # Source
            'customer_name',         # Customer Name
            'customer_phone',        # PH. No
            'customer_email',        # Mail ID
            'vehicle_reg',           # Veh Reg No
            'vehicle_model',         # Model
            'current_km',            # Current KM
            'ots',                   # OTS No
            'service_type',          # Type of Service
            'allocated_sa',          # Allocated SA Name
            'specific_repair',       # Remarks
            'n_minus_1_confirmation',# Status (N-1)
            'upcoming_status',       # Status (UP) - NOT TD
            'docket_readiness',      # Docket Readiness
            'cre_name',              # CRE Name
            'lost_customer',         # Lost Customer
            'priority_customer',     # Priority customer indicator (P badge)
        ]
        
        for appointment in data:
            for field in required_fields:
                assert field in appointment, f"Missing field: {field} in appointment {appointment.get('appointment_id')}"
        
        print(f"All {len(required_fields)} required fields present in all upcoming appointments")
    
    def test_upcoming_filter_by_branch(self):
        """Test branch filter on upcoming view"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming&branch=Main%20Branch")
        assert response.status_code == 200
        data = response.json()
        
        for apt in data:
            assert apt['branch'] == "Main Branch", f"Wrong branch: {apt['branch']}"
        
        print(f"Branch filter on upcoming works: {len(data)} appointments for Main Branch")
    
    def test_upcoming_filter_by_source(self):
        """Test source filter on upcoming view"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming&source=SDR")
        assert response.status_code == 200
        data = response.json()
        
        for apt in data:
            assert apt['source'] == "SDR", f"Wrong source: {apt['source']}"
        
        print(f"Source filter on upcoming works: {len(data)} SDR appointments")
    
    def test_upcoming_sorted_by_date_and_time(self):
        """Appointments should be sorted by date ascending, then time ascending"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming")
        data = response.json()
        
        for i in range(len(data) - 1):
            current = data[i]
            next_apt = data[i + 1]
            
            current_key = (current['appointment_date'], current['appointment_time'])
            next_key = (next_apt['appointment_date'], next_apt['appointment_time'])
            
            assert current_key <= next_key, f"Appointments not sorted: {current_key} > {next_key}"
        
        print("Appointments correctly sorted by date and time")
    
    def test_priority_customers_in_upcoming(self):
        """Verify priority_customer field exists for P badge display"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming")
        data = response.json()
        
        priority_count = sum(1 for apt in data if apt.get('priority_customer'))
        print(f"Priority customers in upcoming: {priority_count}")
        
        for apt in data:
            assert 'priority_customer' in apt
    
    def test_lost_customers_in_upcoming(self):
        """Verify lost_customer field exists for Lost Customer column"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming")
        data = response.json()
        
        lost_count = sum(1 for apt in data if apt.get('lost_customer'))
        print(f"Lost customers in upcoming: {lost_count}")
        
        for apt in data:
            assert 'lost_customer' in apt
    
    def test_remarks_data_in_upcoming(self):
        """Verify specific_repair field for Remarks column with tooltip"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=upcoming")
        data = response.json()
        
        with_remarks = [apt for apt in data if apt.get('specific_repair')]
        without_remarks = [apt for apt in data if not apt.get('specific_repair')]
        
        print(f"Upcoming with remarks (Yes): {len(with_remarks)}")
        print(f"Upcoming without remarks (No): {len(without_remarks)}")


class TestDayViewNoNewAppointmentData:
    """Verify day view returns today's appointments only, no future"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert login_response.status_code == 200
    
    def test_day_view_returns_only_today(self):
        """GET /api/appointments?view=day should return only today's appointments"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=day")
        assert response.status_code == 200
        data = response.json()
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        for apt in data:
            assert apt['appointment_date'] == today, f"Day view returned non-today: {apt['appointment_date']}"
        
        print(f"Day view returns only today ({today}): {len(data)} appointments")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
