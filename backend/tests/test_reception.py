"""
Test Reception Module APIs
Tests: Search vehicle, Check duplicate, Create entry, Get entries, Get single entry
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestReceptionModule:
    """Reception Module API tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create an authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        # Login as admin
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        print(f"Logged in as admin successfully")
        return s
    
    def test_reception_search_vehicle_by_regno(self, session):
        """Test vehicle search by registration number"""
        # Search for a known vehicle
        response = session.get(f"{BASE_URL}/api/reception/search-vehicle?q=WB74")
        assert response.status_code == 200, f"Search failed: {response.text}"
        results = response.json()
        print(f"Search 'WB74' returned {len(results)} results")
        if len(results) > 0:
            print(f"First result: {results[0]}")
            assert "vehicle_reg_no" in results[0], "Result should have vehicle_reg_no"
    
    def test_reception_search_vehicle_by_phone(self, session):
        """Test vehicle search by phone number"""
        response = session.get(f"{BASE_URL}/api/reception/search-vehicle?q=9012")
        assert response.status_code == 200, f"Search failed: {response.text}"
        results = response.json()
        print(f"Search '9012' returned {len(results)} results")
    
    def test_reception_search_vehicle_short_query(self, session):
        """Test vehicle search with too short query (< 2 chars)"""
        response = session.get(f"{BASE_URL}/api/reception/search-vehicle?q=A")
        assert response.status_code == 200, f"Search failed: {response.text}"
        results = response.json()
        assert len(results) == 0, "Short query should return empty results"
        print("Short query correctly returns empty results")
    
    def test_reception_check_duplicate_non_existing(self, session):
        """Test duplicate check for non-existing vehicle"""
        response = session.get(f"{BASE_URL}/api/reception/check-duplicate?reg_no=TESTNONEXIST123&vin=TESTVIN123")
        assert response.status_code == 200, f"Check duplicate failed: {response.text}"
        data = response.json()
        print(f"Duplicate check result: {data}")
        assert "duplicate_reg" in data, "Should have duplicate_reg field"
        assert "duplicate_vin" in data, "Should have duplicate_vin field"
    
    def test_reception_create_entry(self, session):
        """Test creating a new reception entry"""
        now = datetime.utcnow().isoformat()
        entry_data = {
            "vehicle_reception_time": now,
            "source": "Walk-in",
            "vehicle_reg_no": f"TEST{datetime.now().strftime('%H%M%S')}",
            "vin": f"TESTVIN{datetime.now().strftime('%H%M%S')}",
            "engine_no": "ENG123456",
            "customer_type": "Individual",
            "first_name": "Test",
            "last_name": "Customer",
            "contact_no": "9876543210",
            "email": "test@example.com",
            "address": "123 Test Street",
            "city": "Test City",
            "state": "Test State",
            "pin": "123456",
            "driven_by": "Owner",
            "insurance_attached": True,
            "insurance_not_collected": False,
            "rc_attached": True,
            "rc_not_collected": False,
            "branch": "Main Branch"
        }
        response = session.post(f"{BASE_URL}/api/reception", json=entry_data)
        assert response.status_code == 201, f"Create entry failed: {response.text}"
        data = response.json()
        print(f"Created entry: {data.get('entry_id')}")
        
        # Verify response fields
        assert "entry_id" in data, "Response should have entry_id"
        assert data["vehicle_reg_no"] == entry_data["vehicle_reg_no"].upper().replace(" ", ""), "Reg no should be normalized"
        assert data["contact_no"] == entry_data["contact_no"], "Contact should match"
        assert data["status"] == "Completed", "Status should be Completed (contact + docs ok)"
        
        # Store entry_id for later tests
        TestReceptionModule.created_entry_id = data["entry_id"]
        return data
    
    def test_reception_get_entries_today(self, session):
        """Test getting reception entries for today"""
        response = session.get(f"{BASE_URL}/api/reception?date_filter=today")
        assert response.status_code == 200, f"Get entries failed: {response.text}"
        data = response.json()
        print(f"Got {len(data)} entries for today")
        assert isinstance(data, list), "Response should be a list"
        
        # Verify our created entry is in the list
        if hasattr(TestReceptionModule, 'created_entry_id'):
            entry_ids = [e.get("entry_id") for e in data]
            assert TestReceptionModule.created_entry_id in entry_ids, "Created entry should be in today's list"
            print(f"Created entry {TestReceptionModule.created_entry_id} found in list")
    
    def test_reception_get_single_entry(self, session):
        """Test getting a single reception entry by ID"""
        if not hasattr(TestReceptionModule, 'created_entry_id'):
            pytest.skip("No entry created in previous test")
        
        entry_id = TestReceptionModule.created_entry_id
        response = session.get(f"{BASE_URL}/api/reception/{entry_id}")
        assert response.status_code == 200, f"Get entry failed: {response.text}"
        data = response.json()
        print(f"Got entry: {data.get('entry_id')}")
        
        # Verify response fields
        assert data["entry_id"] == entry_id, "Entry ID should match"
        assert "vehicle_reg_no" in data, "Should have vehicle_reg_no"
        assert "customer_name" in data, "Should have customer_name"
        assert "status" in data, "Should have status"
        assert "contact_no" in data, "Should have contact_no"
    
    def test_reception_get_nonexistent_entry(self, session):
        """Test getting a non-existent entry returns 404"""
        response = session.get(f"{BASE_URL}/api/reception/nonexistent_entry_id")
        assert response.status_code == 404, f"Should return 404, got {response.status_code}"
        print("Non-existent entry correctly returns 404")
    
    def test_reception_filter_by_source(self, session):
        """Test filtering reception entries by source"""
        response = session.get(f"{BASE_URL}/api/reception?date_filter=today&source=Walk-in")
        assert response.status_code == 200, f"Filter failed: {response.text}"
        data = response.json()
        print(f"Got {len(data)} Walk-in entries")
        # All returned entries should have source "Walk-in"
        for entry in data:
            assert entry.get("source") == "Walk-in", f"Entry should have source Walk-in, got {entry.get('source')}"
    
    def test_reception_filter_by_status(self, session):
        """Test filtering reception entries by status"""
        response = session.get(f"{BASE_URL}/api/reception?date_filter=today&status=Completed")
        assert response.status_code == 200, f"Filter failed: {response.text}"
        data = response.json()
        print(f"Got {len(data)} Completed entries")
        # All returned entries should have status "Completed"
        for entry in data:
            assert entry.get("status") == "Completed", f"Entry should have status Completed, got {entry.get('status')}"
    
    def test_reception_create_entry_documents_pending(self, session):
        """Test creating entry without documents -> status should be Documents Pending"""
        now = datetime.utcnow().isoformat()
        entry_data = {
            "vehicle_reception_time": now,
            "source": "Appointment",
            "vehicle_reg_no": f"DOCPEND{datetime.now().strftime('%H%M%S')}",
            "vin": f"DOCPENDVIN{datetime.now().strftime('%H%M%S')}",
            "customer_type": "Individual",
            "first_name": "DocPending",
            "last_name": "Test",
            "contact_no": "9876543211",
            "insurance_attached": False,
            "insurance_not_collected": False,
            "rc_attached": False,
            "rc_not_collected": False,
            "branch": "Main Branch"
        }
        response = session.post(f"{BASE_URL}/api/reception", json=entry_data)
        assert response.status_code == 201, f"Create entry failed: {response.text}"
        data = response.json()
        print(f"Created entry with status: {data.get('status')}")
        assert data["status"] == "Documents Pending", f"Status should be Documents Pending, got {data.get('status')}"
    
    def test_reception_vehicle_details_endpoint(self, session):
        """Test getting vehicle details by reg no"""
        # First create an entry to ensure vehicle exists
        if hasattr(TestReceptionModule, 'created_entry_id'):
            # Get the entry we created earlier
            response = session.get(f"{BASE_URL}/api/reception/{TestReceptionModule.created_entry_id}")
            if response.status_code == 200:
                entry = response.json()
                reg_no = entry.get("vehicle_reg_no")
                if reg_no:
                    # Try to get vehicle details
                    response = session.get(f"{BASE_URL}/api/reception/vehicle/{reg_no}")
                    assert response.status_code == 200, f"Get vehicle details failed: {response.text}"
                    data = response.json()
                    if data:
                        print(f"Got vehicle details: {data}")
                        assert data.get("vehicle_reg_no") == reg_no, "Vehicle reg should match"
                    else:
                        print("Vehicle not found (returned null) - may not have been saved to vehicles collection")


class TestReceptionAuth:
    """Test Reception endpoints require authentication"""
    
    def test_reception_search_requires_auth(self):
        """Test that search endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/reception/search-vehicle?q=test")
        assert response.status_code == 401, f"Should return 401, got {response.status_code}"
        print("Search correctly requires authentication")
    
    def test_reception_get_entries_requires_auth(self):
        """Test that get entries endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/reception")
        assert response.status_code == 401, f"Should return 401, got {response.status_code}"
        print("Get entries correctly requires authentication")
    
    def test_reception_create_requires_auth(self):
        """Test that create endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/reception", json={
            "vehicle_reception_time": "2026-01-01T10:00:00",
            "source": "Walk-in",
            "vehicle_reg_no": "TEST123",
            "vin": "TESTVIN123",
            "contact_no": "1234567890"
        })
        assert response.status_code == 401, f"Should return 401, got {response.status_code}"
        print("Create correctly requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
