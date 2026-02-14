"""
Backend API Tests for Appointment (Today) Screen
Tests the following endpoints:
- POST /api/auth/login - Login with admin credentials
- GET /api/appointments?view=day - Today's appointments with all required fields
- GET /api/settings - Settings for filters
- GET /api/users/cres - CRE users for filter
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://crm-appt-ui.preview.emergentagent.com').rstrip('/')

class TestLoginAuth:
    """Authentication tests"""
    
    def test_login_admin_success(self):
        """Test login with admin/admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert data["username"] == "admin"
        assert "role" in data
        print(f"Login successful: {data['name']} ({data['role']})")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wrong",
            "password": "wrong"
        })
        assert response.status_code == 401


class TestAppointmentsAPI:
    """Appointments endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert login_response.status_code == 200
    
    def test_get_appointments_day_view_returns_14(self):
        """GET /api/appointments?view=day should return 14 appointments"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=day")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 14, f"Expected 14 appointments, got {len(data)}"
        print(f"Today's appointments count: {len(data)}")
    
    def test_appointments_have_all_required_fields(self):
        """Verify appointments have all required fields for 16-column table"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=day")
        assert response.status_code == 200
        data = response.json()
        
        # Required fields for the 16-column table
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
            'docket_readiness',      # Docket Readiness
            'appointment_status',    # Status (TD)
            'n_minus_1_confirmation',# Status (N-1)
            'cre_name',              # CRE Name
            'lost_customer',         # Lost Customer
            'specific_repair',       # Remarks
            'priority_customer',     # Priority customer indicator (P badge)
            'rescheduled_in_n1',     # For separating into sections
            'cancelled_in_n1',       # For separating into sections
            'branch',                # For filtering
            'assigned_cre_user',     # For CRE filter
            'appointment_day_outcome'# For outcome display
        ]
        
        for appointment in data:
            for field in required_fields:
                assert field in appointment, f"Missing field: {field} in appointment {appointment.get('appointment_id')}"
        
        print(f"All {len(required_fields)} required fields present in all appointments")
    
    def test_regular_appointments_count(self):
        """Main table should show 10 regular appointments (rescheduled_in_n1=false and cancelled_in_n1=false)"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=day")
        assert response.status_code == 200
        data = response.json()
        
        regular = [apt for apt in data if not apt.get('rescheduled_in_n1') and not apt.get('cancelled_in_n1')]
        rescheduled_cancelled = [apt for apt in data if apt.get('rescheduled_in_n1') or apt.get('cancelled_in_n1')]
        
        assert len(regular) == 10, f"Expected 10 regular appointments, got {len(regular)}"
        assert len(rescheduled_cancelled) == 4, f"Expected 4 rescheduled/cancelled, got {len(rescheduled_cancelled)}"
        print(f"Regular appointments: {len(regular)}, Rescheduled/Cancelled: {len(rescheduled_cancelled)}")
    
    def test_appointments_have_n1_and_td_status(self):
        """Verify appointments have both N-1 and TD status fields"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=day")
        data = response.json()
        
        for apt in data:
            # N-1 status
            assert 'n_minus_1_confirmation' in apt, f"Missing n_minus_1_confirmation in {apt.get('appointment_id')}"
            # TD status
            assert 'appointment_status' in apt, f"Missing appointment_status in {apt.get('appointment_id')}"
        
        print("All appointments have N-1 and TD status fields")
    
    def test_appointments_have_remarks_field(self):
        """Verify appointments have specific_repair field for Remarks column"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=day")
        data = response.json()
        
        with_remarks = [apt for apt in data if apt.get('specific_repair')]
        without_remarks = [apt for apt in data if not apt.get('specific_repair')]
        
        print(f"Appointments with remarks (Yes): {len(with_remarks)}")
        print(f"Appointments without remarks (No): {len(without_remarks)}")
        
        # Check specific_repair field exists in all
        for apt in data:
            assert 'specific_repair' in apt
    
    def test_priority_customer_indicator(self):
        """Verify priority_customer field exists for P badge"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=day")
        data = response.json()
        
        priority_customers = [apt for apt in data if apt.get('priority_customer')]
        print(f"Priority customers (with P badge): {len(priority_customers)}")
        
        for apt in data:
            assert 'priority_customer' in apt
    
    def test_filter_by_branch(self):
        """Test branch filter - selecting 'Main Branch' should reduce results"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=day&branch=Main%20Branch")
        assert response.status_code == 200
        data = response.json()
        
        # Should have fewer than total (14)
        assert len(data) < 14, f"Branch filter didn't reduce results (got {len(data)})"
        
        # All should be Main Branch
        for apt in data:
            assert apt['branch'] == "Main Branch", f"Wrong branch: {apt['branch']}"
        
        print(f"Main Branch filter: {len(data)} appointments")
    
    def test_filter_by_source(self):
        """Test source filter - selecting 'SDR' should filter by SDR source"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=day&source=SDR")
        assert response.status_code == 200
        data = response.json()
        
        for apt in data:
            assert apt['source'] == "SDR", f"Wrong source: {apt['source']}"
        
        print(f"SDR source filter: {len(data)} appointments")
    
    def test_filter_by_sa(self):
        """Test SA filter - selecting 'Arjun' should filter"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=day&sa=Arjun")
        assert response.status_code == 200
        data = response.json()
        
        for apt in data:
            assert apt['allocated_sa'] == "Arjun", f"Wrong SA: {apt['allocated_sa']}"
        
        print(f"Arjun SA filter: {len(data)} appointments")
    
    def test_filter_by_cre(self):
        """Test CRE filter - selecting a CRE should filter results"""
        response = self.session.get(f"{BASE_URL}/api/appointments?view=day&cre=user_cre_001")
        assert response.status_code == 200
        data = response.json()
        
        for apt in data:
            assert apt['assigned_cre_user'] == "user_cre_001", f"Wrong CRE: {apt['assigned_cre_user']}"
        
        print(f"CRE filter (user_cre_001): {len(data)} appointments")


class TestSettingsAPI:
    """Settings endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert login_response.status_code == 200
    
    def test_get_settings(self):
        """GET /api/settings should return filter options"""
        response = self.session.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        
        assert 'branches' in data
        assert 'service_advisors' in data
        assert 'sources' in data
        assert 'appointment_statuses' in data
        assert 'appointment_day_outcomes' in data
        
        print(f"Settings loaded - Branches: {data['branches']}, SAs: {data['service_advisors']}")
    
    def test_settings_have_sa_names_matching_data(self):
        """Settings SA names should match appointment data (Arjun, Vivek)"""
        response = self.session.get(f"{BASE_URL}/api/settings")
        data = response.json()
        
        expected_sas = ["Arjun", "Vivek"]
        for sa in expected_sas:
            assert sa in data['service_advisors'], f"SA {sa} not in settings"
        
        print(f"SAs match data: {data['service_advisors']}")


class TestCREsAPI:
    """CREs endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert login_response.status_code == 200
    
    def test_get_cres(self):
        """GET /api/users/cres should return CRE users"""
        response = self.session.get(f"{BASE_URL}/api/users/cres")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0, "No CREs returned"
        
        for cre in data:
            assert 'user_id' in cre
            assert 'name' in cre
            assert cre['role'] == 'CRE'
        
        print(f"CREs loaded: {[c['name'] for c in data]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
