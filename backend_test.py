#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime, timedelta

class CRAppointmentAPITester:
    def __init__(self, base_url="https://crm-appt-ui.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()  # Use session to maintain cookies
        self.crm_user = None  # Will store CRM user data after login
        self.cre_user = None  # Will store CRE user data after login
        self.reception_user = None  # Will store Receptionist user data after login
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, use_session=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name} ({description})")
        
        try:
            session_to_use = use_session if use_session else requests
            
            if method == 'GET':
                response = session_to_use.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = session_to_use.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = session_to_use.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = session_to_use.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return success, response_data
                except:
                    return success, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                self.failed_tests.append(f"{name}: {error_msg}")
                print(f"❌ Failed - {error_msg}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.RequestException as e:
            error_msg = f"Request failed: {str(e)}"
            self.failed_tests.append(f"{name}: {error_msg}")
            print(f"❌ Failed - {error_msg}")
            return False, {}
            
    def login_user(self, username, password):
        """Login a user and return session"""
        session = requests.Session()
        url = f"{self.base_url}/api/auth/login"
        data = {"username": username, "password": password}
        
        try:
            response = session.post(url, json=data, timeout=10)
            if response.status_code == 200:
                user_data = response.json()
                print(f"✅ Logged in as {user_data['name']} ({user_data['role']})")
                return session, user_data
            else:
                print(f"❌ Login failed: {response.status_code}")
                return None, None
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return None, None

    def test_basic_endpoints(self):
        """Test basic API endpoints"""
        print("\n🚀 Testing Basic Endpoints")
        
        # Test root endpoint
        self.run_test("Root API", "GET", "", 200, description="Basic API health check")
        
        # Test auth endpoints without authentication (should fail)
        self.run_test("Auth Me (No Token)", "GET", "auth/me", 401, description="Should require authentication")
        
        return True

    def test_authentication(self):
        """Test authentication endpoints with username/password"""
        print("\n🔐 Testing Authentication")
        
        # Test login with admin credentials
        success, _ = self.run_test(
            "Login Admin", "POST", "auth/login", 200,
            data={"username": "admin", "password": "admin"}, 
            description="Login with admin credentials"
        )
        if success:
            self.session, self.crm_user = self.login_user("admin", "admin")
            
        # Test login with CRE credentials  
        success, _ = self.run_test(
            "Login CRE", "POST", "auth/login", 200,
            data={"username": "cre1", "password": "cre123"}, 
            description="Login with CRE credentials"
        )
        if success:
            cre_session, self.cre_user = self.login_user("cre1", "cre123")
            
        # Test login with Reception credentials
        success, _ = self.run_test(
            "Login Reception", "POST", "auth/login", 200,
            data={"username": "reception", "password": "reception123"}, 
            description="Login with reception credentials"
        )
        if success:
            reception_session, self.reception_user = self.login_user("reception", "reception123")
            
        # Test invalid credentials
        self.run_test(
            "Invalid Login", "POST", "auth/login", 401,
            data={"username": "admin", "password": "wrong"}, 
            description="Should fail with wrong password"
        )
        
        # Test auth/me with logged in session
        if self.session and self.crm_user:
            success, user_data = self.run_test(
                "Auth Me (CRM)", "GET", "auth/me", 200, 
                use_session=self.session, description="Get current user info"
            )
            if success and user_data:
                print(f"   CRM User: {user_data.get('name')} - Role: {user_data.get('role')}")
            
        return True

    def test_settings_api(self):
        """Test settings endpoints"""
        print("\n⚙️  Testing Settings API")
        
        if not self.session:
            print("⚠️ Skipping settings tests - no authenticated session")
            return False
        
        # Get settings (authenticated)
        self.run_test(
            "Get Settings", "GET", "settings", 200, 
            use_session=self.session, description="Fetch application settings"
        )
        
        # Update settings (CRM only)
        settings_update = {
            "branches": ["Test Branch", "Main Branch", "North Branch"]
        }
        self.run_test(
            "Update Settings (CRM)", "PUT", "settings", 200, 
            data=settings_update, use_session=self.session, description="Update settings as CRM"
        )
        
        # Try to update settings as CRE (should fail)
        if self.cre_user:
            cre_session, _ = self.login_user("cre1", "cre123")
            if cre_session:
                self.run_test(
                    "Update Settings (CRE)", "PUT", "settings", 403, 
                    data=settings_update, use_session=cre_session, description="CRE should not be able to update settings"
                )
        
        return True

    def test_appointments_api(self):
        """Test appointments endpoints"""
        print("\n📅 Testing Appointments API")
        
        if not self.session:
            print("⚠️ Skipping appointments tests - no authenticated session")
            return False
        
        # Get appointments
        success, appointments = self.run_test(
            "Get Appointments", "GET", "appointments", 200, 
            use_session=self.session, description="Fetch all appointments"
        )
        
        if success and appointments:
            print(f"   Found {len(appointments)} appointments")
        
        # Get today's appointments
        today = datetime.now().strftime("%Y-%m-%d")
        self.run_test(
            "Get Today Appointments", "GET", f"appointments?view=day&date={today}", 200, 
            use_session=self.session, description="Fetch today's appointments"
        )
        
        # Get month appointments
        month = datetime.now().month
        year = datetime.now().year
        self.run_test(
            "Get Month Appointments", "GET", f"appointments?view=month&month={month}&year={year}", 200, 
            use_session=self.session, description="Fetch current month appointments"
        )
        
        # Create new appointment
        new_appointment = {
            "branch": "Main Branch",
            "appointment_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "appointment_time": "14:30",
            "source": "SDR",
            "customer_name": "Test Customer API",
            "customer_phone": "9999888877",
            "customer_email": "testapi@example.com",
            "vehicle_reg_no": "KA99TEST123",
            "model": "Kwid",
            "current_km": 15000,
            "ots_recall": False,
            "service_type": "PMS",
            "allocated_sa": "SA - John",
            "specific_repair_request": "Test appointment created via API",
            "priority_customer": False,
            "docket_readiness": True,
            "recovered_lost_customer": False
        }
        
        success, created_appt = self.run_test(
            "Create Appointment", "POST", "appointments", 201, 
            data=new_appointment, use_session=self.session, description="Create new appointment"
        )
        
        appointment_id = None
        if success and created_appt:
            appointment_id = created_appt.get('appointment_id')
            print(f"   Created appointment ID: {appointment_id}")
            
            # Get specific appointment
            self.run_test(
                "Get Single Appointment", "GET", f"appointments/{appointment_id}", 200, 
                use_session=self.session, description="Fetch specific appointment details"
            )
            
            # Update appointment
            update_data = {
                "appointment_status": "Confirmed",
                "n_minus_1_confirmation_status": "Confirmed"
            }
            self.run_test(
                "Update Appointment", "PUT", f"appointments/{appointment_id}", 200, 
                data=update_data, use_session=self.session, description="Update appointment status"
            )
            
            # Get appointment activity log
            self.run_test(
                "Get Activity Log", "GET", f"appointments/{appointment_id}/activity", 200, 
                use_session=self.session, description="Fetch appointment activity history"
            )
        
        # Test duplicate check
        self.run_test(
            "Check Duplicates", "GET", "appointments/duplicates/check?phone=9999888877", 200, 
            use_session=self.session, description="Check for duplicate customer records"
        )
        
        return True

    def test_users_api(self):
        """Test users endpoints"""
        print("\n👥 Testing Users API")
        
        if not self.session:
            print("⚠️ Skipping users tests - no authenticated session")
            return False
        
        # Get all users (CRM only)
        success, users = self.run_test(
            "Get Users (CRM)", "GET", "users", 200, 
            use_session=self.session, description="Fetch all users as CRM"
        )
        
        if success and users:
            print(f"   Found {len(users)} users")
        
        # Try to get users as CRE (should fail)
        if self.cre_user:
            cre_session, _ = self.login_user("cre1", "cre123")
            if cre_session:
                self.run_test(
                    "Get Users (CRE)", "GET", "users", 403, 
                    use_session=cre_session, description="CRE should not access user management"
                )
        
        # Get CREs (any authenticated user)
        success, cres = self.run_test(
            "Get CREs", "GET", "users/cres", 200, 
            use_session=self.session, description="Fetch CRE users list"
        )
        
        if success and cres:
            print(f"   Found {len(cres)} CRE users")
            
        return True

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n📊 Testing Dashboard Stats")
        
        if not self.session:
            print("⚠️ Skipping dashboard tests - no authenticated session")
            return False
        
        success, stats = self.run_test(
            "Get Dashboard Stats", "GET", "dashboard/stats", 200, 
            use_session=self.session, description="Fetch dashboard statistics"
        )
        
        if success and stats:
            print(f"   Today's appointments: {stats.get('today_total', 0)}")
            print(f"   Pending tomorrow: {stats.get('pending_tomorrow', 0)}")
            print(f"   No-show rate: {stats.get('no_show_rate', 0)}%")
            print(f"   Recovered customers: {stats.get('recovered_count', 0)}")
            
        return True

    def test_tasks_api(self):
        """Test tasks endpoints"""
        print("\n📋 Testing Tasks API")
        
        if not self.session:
            print("⚠️ Skipping tasks tests - no authenticated session")
            return False
        
        # Get pending tasks
        success, tasks = self.run_test(
            "Get Pending Tasks", "GET", "tasks?status=pending", 200, 
            use_session=self.session, description="Fetch pending tasks"
        )
        
        if success and tasks:
            print(f"   Found {len(tasks)} pending tasks")
            
        return True

    def test_export_api(self):
        """Test export functionality"""
        print("\n📤 Testing Export API")
        
        if not self.session:
            print("⚠️ Skipping export tests - no authenticated session")
            return False
        
        # Test CSV export (CRM only)
        month = datetime.now().month
        year = datetime.now().year
        
        success, _ = self.run_test(
            "Export CSV", "GET", f"export/csv?view=month&month={month}&year={year}", 200, 
            use_session=self.session, description="Export appointments to CSV"
        )
        
        # Try export as CRE (should fail)
        if self.cre_user:
            cre_session, _ = self.login_user("cre1", "cre123")
            if cre_session:
                self.run_test(
                    "Export CSV (CRE)", "GET", f"export/csv?view=month&month={month}&year={year}", 403, 
                    use_session=cre_session, description="CRE should not be able to export"
                )
        
        return True

    def run_all_tests(self):
        """Run all test suites"""
        print("🧪 Starting CR Appointment System API Tests")
        print("=" * 60)
        
        try:
            self.test_basic_endpoints()
            self.test_authentication()
            self.test_settings_api()
            self.test_appointments_api()
            self.test_users_api()
            self.test_dashboard_stats()
            self.test_tasks_api()
            self.test_export_api()
            
        except KeyboardInterrupt:
            print("\n⏹️ Tests interrupted by user")
            return 1
            
        except Exception as e:
            print(f"\n💥 Test suite crashed: {str(e)}")
            return 1
        
        # Print results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS")
        print("=" * 60)
        print(f"✅ Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests failed: {len(self.failed_tests)}/{self.tests_run}")
        
        if self.failed_tests:
            print("\n🚫 Failed Tests:")
            for failure in self.failed_tests:
                print(f"   • {failure}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 Backend API tests mostly successful!")
            return 0
        else:
            print("⚠️ Backend API has significant issues!")
            return 1


def main():
    tester = CRAppointmentAPITester()
    return tester.run_all_tests()


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)