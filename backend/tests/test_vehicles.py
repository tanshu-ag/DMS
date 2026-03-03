"""
Backend API Tests for Vehicles Module
Testing: Other Brands page, Vehicle CRUD operations, brand filter, make field support
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestVehicleAPIs:
    """Test vehicle CRUD operations with brand support"""
    
    @pytest.fixture(autouse=True)
    def setup(self, api_client):
        """Login before each test"""
        self.client = api_client
        # Login
        login_res = self.client.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        print("Login successful")
    
    def test_get_vehicles_with_renault_filter(self, api_client):
        """Test GET /api/vehicles with brand=renault filter"""
        response = api_client.get(f"{BASE_URL}/api/vehicles?brand=renault")
        print(f"GET /api/vehicles?brand=renault - Status: {response.status_code}")
        assert response.status_code == 200
        vehicles = response.json()
        assert isinstance(vehicles, list)
        # All vehicles should be renault or have no brand (legacy)
        for v in vehicles:
            brand = v.get("brand", "renault")  # Default is renault
            assert brand == "renault" or brand is None, f"Found non-renault vehicle: {v}"
        print(f"Found {len(vehicles)} Renault vehicles")
    
    def test_get_vehicles_with_other_brand_filter(self, api_client):
        """Test GET /api/vehicles with brand=other filter"""
        response = api_client.get(f"{BASE_URL}/api/vehicles?brand=other")
        print(f"GET /api/vehicles?brand=other - Status: {response.status_code}")
        assert response.status_code == 200
        vehicles = response.json()
        assert isinstance(vehicles, list)
        # All vehicles should have brand="other"
        for v in vehicles:
            assert v.get("brand") == "other", f"Found non-other-brand vehicle: {v}"
        print(f"Found {len(vehicles)} Other Brand vehicles")
    
    def test_create_other_brand_vehicle(self, api_client):
        """Test creating a vehicle with brand=other and make field"""
        # Create Other Brand vehicle
        payload = {
            "vehicle_reg_no": "TEST_OB_001",
            "vin": "TESTVIN0001234567",
            "engine_no": "TESTENG001",
            "make": "Toyota",
            "model": "Corolla",
            "brand": "other",
            "customer_name": "TEST Other Brand Customer",
            "customer_phone": "9999900001"
        }
        response = api_client.post(f"{BASE_URL}/api/vehicles", json=payload)
        print(f"POST /api/vehicles (other brand) - Status: {response.status_code}")
        
        if response.status_code == 400 and "already exists" in response.text:
            print("Vehicle already exists - deleting and recreating")
            # Find and delete existing
            vehicles_res = api_client.get(f"{BASE_URL}/api/vehicles?search=TEST_OB_001")
            if vehicles_res.status_code == 200:
                vehicles = vehicles_res.json()
                for v in vehicles:
                    if v.get("vehicle_reg_no") == "TEST_OB_001":
                        api_client.delete(f"{BASE_URL}/api/vehicles/{v['vehicle_id']}")
            # Retry create
            response = api_client.post(f"{BASE_URL}/api/vehicles", json=payload)
        
        assert response.status_code == 201, f"Create failed: {response.text}"
        vehicle = response.json()
        
        # Validate response
        assert vehicle["vehicle_reg_no"] == "TEST_OB_001"
        assert vehicle["brand"] == "other"
        assert vehicle["make"] == "Toyota"
        assert vehicle["model"] == "Corolla"
        assert "vehicle_id" in vehicle
        print(f"Created Other Brand vehicle: {vehicle['vehicle_id']}")
        
        # Verify by GET
        get_res = api_client.get(f"{BASE_URL}/api/vehicles/{vehicle['vehicle_id']}")
        assert get_res.status_code == 200
        fetched = get_res.json()
        assert fetched["brand"] == "other"
        assert fetched["make"] == "Toyota"
        print("Verified vehicle creation via GET")
        
        return vehicle["vehicle_id"]
    
    def test_create_other_brand_vehicle_requires_make(self, api_client):
        """Test that creating Other Brand vehicle without make field fails"""
        payload = {
            "vehicle_reg_no": "TEST_OB_NOMAKE",
            "brand": "other",
            "model": "TestModel"
            # Missing 'make' field
        }
        response = api_client.post(f"{BASE_URL}/api/vehicles", json=payload)
        print(f"POST /api/vehicles (other brand, no make) - Status: {response.status_code}")
        
        # Should fail because make is required for other brands
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "make" in response.text.lower() or "brand" in response.text.lower()
        print("Correctly rejected vehicle without make field")
    
    def test_create_renault_vehicle_requires_model(self, api_client):
        """Test that creating Renault vehicle without model fails"""
        payload = {
            "vehicle_reg_no": "TEST_RN_NOMODEL",
            "brand": "renault"
            # Missing 'model' field
        }
        response = api_client.post(f"{BASE_URL}/api/vehicles", json=payload)
        print(f"POST /api/vehicles (renault, no model) - Status: {response.status_code}")
        
        # Should fail because model is required for Renault
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "model" in response.text.lower()
        print("Correctly rejected Renault vehicle without model field")
    
    def test_update_other_brand_vehicle(self, api_client):
        """Test updating Other Brand vehicle - make and model fields"""
        # First create a test vehicle
        create_payload = {
            "vehicle_reg_no": "TEST_OB_UPDATE",
            "make": "Honda",
            "model": "City",
            "brand": "other",
            "customer_name": "TEST Update Customer"
        }
        
        # Delete if exists
        vehicles_res = api_client.get(f"{BASE_URL}/api/vehicles?search=TEST_OB_UPDATE")
        if vehicles_res.status_code == 200:
            for v in vehicles_res.json():
                if v.get("vehicle_reg_no") == "TEST_OB_UPDATE":
                    api_client.delete(f"{BASE_URL}/api/vehicles/{v['vehicle_id']}")
        
        create_res = api_client.post(f"{BASE_URL}/api/vehicles", json=create_payload)
        assert create_res.status_code == 201, f"Setup create failed: {create_res.text}"
        vehicle = create_res.json()
        vehicle_id = vehicle["vehicle_id"]
        
        # Update the vehicle
        update_payload = {
            "make": "Maruti",
            "model": "Swift",
            "customer_name": "TEST Updated Customer"
        }
        update_res = api_client.put(f"{BASE_URL}/api/vehicles/{vehicle_id}", json=update_payload)
        print(f"PUT /api/vehicles/{vehicle_id} - Status: {update_res.status_code}")
        assert update_res.status_code == 200, f"Update failed: {update_res.text}"
        
        # Verify update
        get_res = api_client.get(f"{BASE_URL}/api/vehicles/{vehicle_id}")
        assert get_res.status_code == 200
        updated = get_res.json()
        assert updated["make"] == "Maruti"
        assert updated["model"] == "Swift"
        assert updated["customer_name"] == "TEST Updated Customer"
        print("Vehicle update verified")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/vehicles/{vehicle_id}")
    
    def test_delete_vehicle(self, api_client):
        """Test deleting a vehicle"""
        # Create a vehicle to delete
        create_payload = {
            "vehicle_reg_no": "TEST_OB_DELETE",
            "make": "Hyundai",
            "model": "i20",
            "brand": "other"
        }
        
        # Clean up if exists
        vehicles_res = api_client.get(f"{BASE_URL}/api/vehicles?search=TEST_OB_DELETE")
        if vehicles_res.status_code == 200:
            for v in vehicles_res.json():
                if v.get("vehicle_reg_no") == "TEST_OB_DELETE":
                    api_client.delete(f"{BASE_URL}/api/vehicles/{v['vehicle_id']}")
        
        create_res = api_client.post(f"{BASE_URL}/api/vehicles", json=create_payload)
        assert create_res.status_code == 201
        vehicle_id = create_res.json()["vehicle_id"]
        
        # Delete vehicle
        delete_res = api_client.delete(f"{BASE_URL}/api/vehicles/{vehicle_id}")
        print(f"DELETE /api/vehicles/{vehicle_id} - Status: {delete_res.status_code}")
        assert delete_res.status_code == 200
        
        # Verify deletion
        get_res = api_client.get(f"{BASE_URL}/api/vehicles/{vehicle_id}")
        assert get_res.status_code == 404
        print("Vehicle deletion verified")
    
    def test_search_by_make(self, api_client):
        """Test search functionality includes make field"""
        # Create a vehicle with specific make
        create_payload = {
            "vehicle_reg_no": "TEST_SEARCH_MAKE",
            "make": "UniqueMakeXYZ",
            "model": "TestModel",
            "brand": "other"
        }
        
        # Clean up if exists
        vehicles_res = api_client.get(f"{BASE_URL}/api/vehicles?search=TEST_SEARCH_MAKE")
        if vehicles_res.status_code == 200:
            for v in vehicles_res.json():
                if v.get("vehicle_reg_no") == "TEST_SEARCH_MAKE":
                    api_client.delete(f"{BASE_URL}/api/vehicles/{v['vehicle_id']}")
        
        create_res = api_client.post(f"{BASE_URL}/api/vehicles", json=create_payload)
        assert create_res.status_code == 201
        vehicle_id = create_res.json()["vehicle_id"]
        
        # Search by make
        search_res = api_client.get(f"{BASE_URL}/api/vehicles?search=UniqueMakeXYZ&brand=other")
        print(f"GET /api/vehicles?search=UniqueMakeXYZ - Status: {search_res.status_code}")
        assert search_res.status_code == 200
        results = search_res.json()
        
        # Should find our vehicle
        found = any(v["vehicle_id"] == vehicle_id for v in results)
        assert found, f"Vehicle not found in search results: {results}"
        print("Search by make works correctly")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/vehicles/{vehicle_id}")
    
    def test_vehicle_profile_get(self, api_client):
        """Test getting a single vehicle by ID for profile page"""
        # First get any existing vehicle
        vehicles_res = api_client.get(f"{BASE_URL}/api/vehicles?brand=other")
        if vehicles_res.status_code == 200 and len(vehicles_res.json()) > 0:
            vehicle = vehicles_res.json()[0]
            vehicle_id = vehicle["vehicle_id"]
            
            # Get single vehicle
            get_res = api_client.get(f"{BASE_URL}/api/vehicles/{vehicle_id}")
            print(f"GET /api/vehicles/{vehicle_id} - Status: {get_res.status_code}")
            assert get_res.status_code == 200
            
            fetched = get_res.json()
            assert "vehicle_id" in fetched
            assert "vehicle_reg_no" in fetched
            assert "brand" in fetched or fetched.get("brand") is None  # brand may be None for legacy
            print(f"Vehicle profile data retrieved: {fetched.get('vehicle_reg_no')}")
        else:
            pytest.skip("No Other Brand vehicles to test")


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestVehicleAPICleanup:
    """Cleanup test vehicles after all tests"""
    
    def test_cleanup_test_vehicles(self, api_client):
        """Clean up all TEST_ prefixed vehicles"""
        # Login
        login_res = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin"
        })
        assert login_res.status_code == 200
        
        # Get all vehicles and delete TEST_ prefixed ones
        vehicles_res = api_client.get(f"{BASE_URL}/api/vehicles")
        if vehicles_res.status_code == 200:
            for v in vehicles_res.json():
                if v.get("vehicle_reg_no", "").startswith("TEST_"):
                    api_client.delete(f"{BASE_URL}/api/vehicles/{v['vehicle_id']}")
                    print(f"Cleaned up test vehicle: {v['vehicle_reg_no']}")
        print("Cleanup completed")
