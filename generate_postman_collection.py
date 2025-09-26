#!/usr/bin/env python3
"""
CRM Backend Postman Collection Generator
Generates a comprehensive Postman collection with all API endpoints
"""

import json

def create_postman_collection():
    """Create comprehensive Postman collection for CRM Backend"""
    
    collection = {
        "info": {
            "name": "CRM Backend - Complete API Collection",
            "description": "Comprehensive collection of all CRM Backend APIs organized by modules and endpoint types",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            "version": "1.0.0"
        },
        "variable": [
            {
                "key": "baseUrl",
                "value": "http://localhost:3000",
                "type": "string"
            },
            {
                "key": "authToken",
                "value": "",
                "type": "string"
            }
        ],
        "item": []
    }
    
    # Define all modules and their endpoints
    modules = {
        "Authentication": {
            "base_path": "/auth",
            "endpoints": [
                {"method": "POST", "path": "/login", "name": "Login", "body": True},
                {"method": "POST", "path": "/logout", "name": "Logout", "auth": True},
                {"method": "GET", "path": "/profile", "name": "Get Profile", "auth": True},
                {"method": "GET", "path": "/access-logs", "name": "Get Access Logs", "auth": True, "query": True},
                {"method": "GET", "path": "/access-logs/stats", "name": "Get Access Logs Stats", "auth": True},
                {"method": "GET", "path": "/access-logs/export", "name": "Export Access Logs", "auth": True, "query": True}
            ]
        },
        "HR Module": {
            "base_path": "/hr",
            "endpoints": [
                {"method": "POST", "path": "/employees", "name": "Create Employee", "auth": True, "body": True},
                {"method": "POST", "path": "/terminate", "name": "Terminate Employee", "auth": True, "body": True},
                {"method": "GET", "path": "/employees", "name": "Get All Employees", "auth": True, "query": True},
                {"method": "GET", "path": "/employees/:id", "name": "Get Employee by ID", "auth": True},
                {"method": "GET", "path": "/employees/stats", "name": "Get Employee Statistics", "auth": True},
                {"method": "PUT", "path": "/employees/:id", "name": "Update Employee", "auth": True, "body": True},
                {"method": "PATCH", "path": "/employees/:id/bonus", "name": "Update Employee Bonus", "auth": True, "body": True},
                {"method": "PATCH", "path": "/employees/:id/shift", "name": "Update Employee Shift", "auth": True, "body": True},
                {"method": "DELETE", "path": "/employees/:id", "name": "Delete Employee", "auth": True},
                {"method": "GET", "path": "/logs", "name": "Get HR Logs", "auth": True, "query": True},
                {"method": "GET", "path": "/logs/stats", "name": "Get HR Logs Stats", "auth": True},
                {"method": "GET", "path": "/logs/export", "name": "Export HR Logs", "auth": True, "query": True}
            ]
        },
        "Sales Module - Leads": {
            "base_path": "/leads",
            "endpoints": [
                {"method": "POST", "path": "", "name": "Create Lead", "auth": True, "body": True},
                {"method": "POST", "path": "/request", "name": "Request Leads", "auth": True, "body": True},
                {"method": "POST", "path": "/bulk-update", "name": "Bulk Update Leads", "auth": True, "body": True},
                {"method": "GET", "path": "", "name": "Get All Leads", "auth": True, "query": True},
                {"method": "GET", "path": "/:id", "name": "Get Lead by ID", "auth": True},
                {"method": "GET", "path": "/my-leads", "name": "Get My Leads", "auth": True, "query": True},
                {"method": "GET", "path": "/cracked-leads", "name": "Get Cracked Leads", "auth": True, "query": True},
                {"method": "GET", "path": "/statistics/overview", "name": "Get Lead Statistics", "auth": True},
                {"method": "GET", "path": "/filter-options/sales-units", "name": "Get Sales Units for Filter", "auth": True},
                {"method": "GET", "path": "/filter-options/employees", "name": "Get Employees for Filter", "auth": True, "query": True},
                {"method": "PUT", "path": "/:id", "name": "Update Lead", "auth": True, "body": True}
            ]
        },
        "Sales Module - Units": {
            "base_path": "/sales/units",
            "endpoints": [
                {"method": "POST", "path": "/create", "name": "Create Sales Unit", "auth": True, "body": True},
                {"method": "GET", "path": "/get", "name": "Get All Sales Units", "auth": True},
                {"method": "GET", "path": "/get/:id", "name": "Get Sales Unit by ID", "auth": True},
                {"method": "GET", "path": "/available-heads", "name": "Get Available Unit Heads", "auth": True, "query": True},
                {"method": "GET", "path": "/:id/employees", "name": "Get Employees in Unit", "auth": True},
                {"method": "GET", "path": "/:id/leads", "name": "Get Leads in Unit", "auth": True},
                {"method": "GET", "path": "/:id/archive-leads", "name": "Get Archive Leads in Unit", "auth": True},
                {"method": "GET", "path": "/deleted/archive-leads", "name": "Get Archive Leads from Deleted Units", "auth": True},
                {"method": "PATCH", "path": "/update/:id", "name": "Update Sales Unit", "auth": True, "body": True},
                {"method": "DELETE", "path": "/delete/:id", "name": "Delete Sales Unit", "auth": True}
            ]
        },
        "Sales Module - Teams": {
            "base_path": "/sales/teams",
            "endpoints": [
                {"method": "POST", "path": "/create", "name": "Create Team", "auth": True, "body": True},
                {"method": "POST", "path": "/:teamId/add-employee", "name": "Add Employee to Team", "auth": True, "body": True},
                {"method": "POST", "path": "/:teamId/unassign-employees", "name": "Unassign Employees from Team", "auth": True},
                {"method": "POST", "path": "/assign", "name": "Assign Team to Unit", "auth": True, "body": True},
                {"method": "GET", "path": "/all", "name": "Get All Teams", "auth": True, "query": True},
                {"method": "GET", "path": "/available", "name": "Get Available Teams", "auth": True},
                {"method": "GET", "path": "/unit/:id", "name": "Get Teams in Unit", "auth": True},
                {"method": "GET", "path": "/:teamId", "name": "Get Team Details", "auth": True},
                {"method": "GET", "path": "/employee/:employeeId", "name": "Get Employee's Team", "auth": True},
                {"method": "PUT", "path": "/:teamId/replace-lead", "name": "Replace Team Lead", "auth": True, "body": True},
                {"method": "DELETE", "path": "/:teamId/remove-employee/:employeeId", "name": "Remove Employee from Team", "auth": True},
                {"method": "DELETE", "path": "/:teamId", "name": "Delete Team", "auth": True},
                {"method": "DELETE", "path": "/unassign/:teamId", "name": "Unassign Team from Unit", "auth": True}
            ]
        },
        "Finance Module - Salary": {
            "base_path": "/salary",
            "endpoints": [
                {"method": "POST", "path": "/auto", "name": "Calculate All Salaries", "auth": False},
                {"method": "POST", "path": "/commission/assign", "name": "Assign Commission", "auth": True, "body": True},
                {"method": "POST", "path": "/commission/withhold-flag", "name": "Update Withhold Flag", "auth": True, "body": True},
                {"method": "POST", "path": "/commission/transfer", "name": "Transfer Commission", "auth": True, "body": True},
                {"method": "GET", "path": "/calculate/:employeeId", "name": "Calculate Salary Preview", "auth": True, "query": True},
                {"method": "GET", "path": "/display/:employeeId", "name": "Get Salary Display", "auth": True, "query": True},
                {"method": "GET", "path": "/display", "name": "Get All Salaries Display", "auth": True, "query": True},
                {"method": "GET", "path": "/display/:employeeId/detailed", "name": "Get Detailed Salary Breakdown", "auth": True, "query": True}
            ]
        },
        "Finance Module - Accountant": {
            "base_path": "/accountant",
            "endpoints": [
                {"method": "POST", "path": "/vendor/create", "name": "Add Vendor", "auth": True, "body": True},
                {"method": "POST", "path": "/pnl/auto", "name": "Calculate P&L Auto", "auth": False, "body": True},
                {"method": "GET", "path": "/vendors/display", "name": "Get All Vendors", "auth": True},
                {"method": "GET", "path": "/pnl/calculate/:month/:year", "name": "Calculate P&L Preview", "auth": True},
                {"method": "GET", "path": "/pnl/categories/:month/:year", "name": "Calculate P&L with Categories", "auth": True},
                {"method": "PATCH", "path": "/permissions", "name": "Update Permissions", "auth": True, "body": True}
            ]
        },
        "Projects Module": {
            "base_path": "/projects",
            "endpoints": [
                {"method": "POST", "path": "/create-from-payment", "name": "Create Project from Payment", "auth": True, "body": True},
                {"method": "GET", "path": "", "name": "Get All Projects", "auth": True, "query": True},
                {"method": "GET", "path": "/:id", "name": "Get Project by ID", "auth": True},
                {"method": "PUT", "path": "/:id/assign-unit-head", "name": "Assign Unit Head", "auth": True, "body": True},
                {"method": "PUT", "path": "/:id", "name": "Update Project", "auth": True, "body": True}
            ]
        },
        "Project Tasks": {
            "base_path": "/projects/:projectId/tasks",
            "endpoints": [
                {"method": "POST", "path": "", "name": "Create Project Task", "auth": True, "body": True},
                {"method": "GET", "path": "", "name": "Get Project Tasks", "auth": True, "query": True},
                {"method": "GET", "path": "/:taskId", "name": "Get Task by ID", "auth": True},
                {"method": "PUT", "path": "/:taskId", "name": "Update Task", "auth": True, "body": True},
                {"method": "PATCH", "path": "/:taskId/status", "name": "Update Task Status", "auth": True, "body": True}
            ]
        },
        "Project Logs": {
            "base_path": "/projects/:projectId/logs",
            "endpoints": [
                {"method": "POST", "path": "", "name": "Create Project Log", "auth": True, "body": True},
                {"method": "GET", "path": "", "name": "Get Project Logs", "auth": True, "query": True},
                {"method": "GET", "path": "/employees", "name": "Get Project Employees", "auth": True},
                {"method": "GET", "path": "/statistics", "name": "Get Log Statistics", "auth": True},
                {"method": "GET", "path": "/:logId", "name": "Get Log by ID", "auth": True},
                {"method": "PUT", "path": "/:logId", "name": "Update Log", "auth": True, "body": True},
                {"method": "DELETE", "path": "/:logId", "name": "Delete Log", "auth": True}
            ]
        },
        "Client Module": {
            "base_path": "/clients",
            "endpoints": [
                {"method": "POST", "path": "", "name": "Create Client", "auth": True, "body": True},
                {"method": "GET", "path": "", "name": "Get All Clients", "auth": True, "query": True},
                {"method": "GET", "path": "/stats", "name": "Get Client Statistics", "auth": True},
                {"method": "GET", "path": "/:id", "name": "Get Client by ID", "auth": True},
                {"method": "GET", "path": "/search/companies", "name": "Search Companies", "auth": True, "query": True},
                {"method": "GET", "path": "/search/contacts", "name": "Search Contacts", "auth": True, "query": True},
                {"method": "PATCH", "path": "/:id", "name": "Update Client", "auth": True, "body": True},
                {"method": "DELETE", "path": "/:id", "name": "Delete Client", "auth": True}
            ]
        },
        "Campaign Module": {
            "base_path": "/campaigns",
            "endpoints": [
                {"method": "POST", "path": "", "name": "Create Campaign", "auth": True, "body": True},
                {"method": "GET", "path": "", "name": "Get All Campaigns", "auth": True, "query": True},
                {"method": "GET", "path": "/stats", "name": "Get Campaign Statistics", "auth": True},
                {"method": "GET", "path": "/:id", "name": "Get Campaign by ID", "auth": True},
                {"method": "PATCH", "path": "/:id", "name": "Update Campaign", "auth": True, "body": True},
                {"method": "DELETE", "path": "/:id", "name": "Delete Campaign", "auth": True}
            ]
        },
        "Company Module": {
            "base_path": "/company",
            "endpoints": [
                {"method": "POST", "path": "", "name": "Create Company", "auth": True, "body": True},
                {"method": "GET", "path": "", "name": "Get All Companies", "auth": True},
                {"method": "GET", "path": "/:id", "name": "Get Company by ID", "auth": True},
                {"method": "GET", "path": "/settings/attendance", "name": "Get Company Settings", "auth": True},
                {"method": "PUT", "path": "/:id", "name": "Update Company", "auth": True, "body": True},
                {"method": "DELETE", "path": "/:id", "name": "Delete Company", "auth": True}
            ]
        },
        "Admin Module": {
            "base_path": "/admin",
            "endpoints": [
                {"method": "GET", "path": "", "name": "Get All Admins", "auth": True, "query": True},
                {"method": "GET", "path": "/my-profile", "name": "Get My Profile", "auth": True},
                {"method": "GET", "path": "/:id", "name": "Get Admin by ID", "auth": True},
                {"method": "GET", "path": "/email/:email", "name": "Get Admin by Email", "auth": True},
                {"method": "PUT", "path": "/my-profile", "name": "Update My Profile", "auth": True, "body": True},
                {"method": "PUT", "path": "/:id", "name": "Update Admin", "auth": True, "body": True}
            ]
        },
        "Communication - Meetings": {
            "base_path": "/communication/meetings",
            "endpoints": [
                {"method": "POST", "path": "", "name": "Create Meeting", "auth": True, "body": True},
                {"method": "GET", "path": "", "name": "Get All Meetings", "auth": True, "query": True},
                {"method": "GET", "path": "/:id", "name": "Get Meeting by ID", "auth": True},
                {"method": "GET", "path": "/my/meetings", "name": "Get My Meetings", "auth": True},
                {"method": "GET", "path": "/upcoming", "name": "Get Upcoming Meetings", "auth": True},
                {"method": "GET", "path": "/upcoming/:days", "name": "Get Upcoming Meetings by Days", "auth": True},
                {"method": "PATCH", "path": "/:id", "name": "Update Meeting", "auth": True, "body": True},
                {"method": "DELETE", "path": "/:id", "name": "Delete Meeting", "auth": True}
            ]
        },
        "Communication - Notifications": {
            "base_path": "/communication/notifications",
            "endpoints": [
                {"method": "POST", "path": "", "name": "Create Notification", "auth": True, "body": True},
                {"method": "POST", "path": "/bulk", "name": "Create Bulk Notification", "auth": True, "body": True},
                {"method": "GET", "path": "", "name": "Get All Notifications", "auth": True},
                {"method": "GET", "path": "/bulk", "name": "Get Bulk Notification Summary", "auth": True, "query": True},
                {"method": "GET", "path": "/:id", "name": "Get Notification by ID", "auth": True},
                {"method": "GET", "path": "/my/notifications", "name": "Get My Notifications", "auth": True},
                {"method": "GET", "path": "/unread/count", "name": "Get Unread Count", "auth": True},
                {"method": "GET", "path": "/status/:status", "name": "Get Notifications by Status", "auth": True},
                {"method": "PATCH", "path": "/:id", "name": "Update Notification", "auth": True, "body": True},
                {"method": "PATCH", "path": "/:id/read", "name": "Mark as Read", "auth": True},
                {"method": "DELETE", "path": "/:id", "name": "Delete Notification", "auth": True}
            ]
        },
        "Production Units": {
            "base_path": "/production/units",
            "endpoints": [
                {"method": "POST", "path": "/create", "name": "Create Production Unit", "auth": True, "body": True},
                {"method": "GET", "path": "", "name": "Get All Production Units", "auth": True},
                {"method": "GET", "path": "/get/:id", "name": "Get Production Unit by ID", "auth": True},
                {"method": "GET", "path": "/:id/employees", "name": "Get Employees in Unit", "auth": True},
                {"method": "GET", "path": "/:id/projects", "name": "Get Projects in Unit", "auth": True},
                {"method": "GET", "path": "/deleted/completed-projects", "name": "Get Completed Projects from Deleted Units", "auth": True},
                {"method": "GET", "path": "/available-heads", "name": "Get Available Heads", "auth": True, "query": True},
                {"method": "PATCH", "path": "/update/:id", "name": "Update Production Unit", "auth": True, "body": True},
                {"method": "DELETE", "path": "/delete/:id", "name": "Delete Production Unit", "auth": True}
            ]
        },
        "Departments Module": {
            "base_path": "/departments",
            "endpoints": [
                {"method": "POST", "path": "", "name": "Create Department", "auth": True, "body": True},
                {"method": "GET", "path": "", "name": "Get All Departments", "auth": True, "query": True},
                {"method": "GET", "path": "/:id", "name": "Get Department by ID", "auth": True},
                {"method": "PUT", "path": "/:id", "name": "Update Department", "auth": True, "body": True},
                {"method": "DELETE", "path": "/:id", "name": "Delete Department", "auth": True}
            ]
        },
        "Roles Module": {
            "base_path": "/roles",
            "endpoints": [
                {"method": "POST", "path": "", "name": "Create Role", "auth": True, "body": True},
                {"method": "GET", "path": "", "name": "Get All Roles", "auth": True, "query": True},
                {"method": "GET", "path": "/:id", "name": "Get Role by ID", "auth": True},
                {"method": "PUT", "path": "/:id", "name": "Update Role", "auth": True, "body": True},
                {"method": "DELETE", "path": "/:id", "name": "Delete Role", "auth": True}
            ]
        },
        "Attendance Module": {
            "base_path": "/hr/attendance",
            "endpoints": [
                {"method": "POST", "path": "/checkin", "name": "Employee Check-in", "auth": True, "body": True},
                {"method": "POST", "path": "/checkout", "name": "Employee Check-out", "auth": True, "body": True},
                {"method": "POST", "path": "/late-logs", "name": "Submit Late Reason", "auth": True, "body": True},
                {"method": "POST", "path": "/half-day-logs", "name": "Submit Half-day Reason", "auth": True, "body": True},
                {"method": "POST", "path": "/leave-logs", "name": "Create Leave Log", "auth": True, "body": True},
                {"method": "POST", "path": "/process-leave", "name": "Process Leave Action", "auth": True, "body": True},
                {"method": "POST", "path": "/bulk-mark-present", "name": "Bulk Mark Present", "auth": True, "body": True},
                {"method": "GET", "path": "/logs", "name": "Get Attendance Logs", "auth": True, "query": True},
                {"method": "GET", "path": "/late-logs", "name": "Get Late Logs", "auth": True, "query": True},
                {"method": "GET", "path": "/late-logs/employee/:emp_id", "name": "Get Late Logs by Employee", "auth": True},
                {"method": "GET", "path": "/half-day-logs", "name": "Get Half-day Logs", "auth": True, "query": True},
                {"method": "GET", "path": "/half-day-logs/employee/:emp_id", "name": "Get Half-day Logs by Employee", "auth": True},
                {"method": "GET", "path": "/leave-logs", "name": "Get Leave Logs", "auth": True, "query": True},
                {"method": "GET", "path": "/leave-logs/employee/:emp_id", "name": "Get Leave Logs by Employee", "auth": True},
                {"method": "GET", "path": "/monthly-attendance", "name": "Get Monthly Attendance", "auth": True, "query": True},
                {"method": "PUT", "path": "/late-logs", "name": "Update Late Log", "auth": True, "body": True},
                {"method": "PUT", "path": "/half-day-logs", "name": "Update Half-day Log", "auth": True, "body": True},
                {"method": "PUT", "path": "/leave-logs", "name": "Update Leave Log", "auth": True, "body": True},
                {"method": "PUT", "path": "/attendance-logs", "name": "Update Attendance Log", "auth": True, "body": True},
                {"method": "PUT", "path": "/monthly-attendance", "name": "Update Monthly Attendance", "auth": True, "body": True}
            ]
        }
    }
    
    # Generate collection items
    for module_name, module_data in modules.items():
        module_item = {
            "name": module_name,
            "item": []
        }
        
        # Group endpoints by HTTP method
        methods = {}
        for endpoint in module_data["endpoints"]:
            method = endpoint["method"]
            if method not in methods:
                methods[method] = []
            methods[method].append(endpoint)
        
        # Create method groups
        for method, endpoints in methods.items():
            method_item = {
                "name": method,
                "item": []
            }
            
            for endpoint in endpoints:
                request = {
                    "method": method,
                    "header": [],
                    "url": {
                        "raw": f"{{{{baseUrl}}}}{module_data['base_path']}{endpoint['path']}",
                        "host": ["{{baseUrl}}"],
                        "path": module_data["base_path"].split("/")[1:] + endpoint["path"].split("/")[1:] if endpoint["path"] else module_data["base_path"].split("/")[1:]
                    }
                }
                
                # Add authentication header if required
                if endpoint.get("auth", False):
                    request["header"].append({
                        "key": "Authorization",
                        "value": "Bearer {{authToken}}"
                    })
                
                # Add content-type header for requests with body
                if endpoint.get("body", False):
                    request["header"].append({
                        "key": "Content-Type",
                        "value": "application/json"
                    })
                    request["body"] = {
                        "mode": "raw",
                        "raw": "{\n  // Add request body here\n}"
                    }
                
                # Add query parameters if required
                if endpoint.get("query", False):
                    request["url"]["query"] = [
                        {
                            "key": "param1",
                            "value": "value1",
                            "description": "Query parameter"
                        }
                    ]
                
                method_item["item"].append({
                    "name": endpoint["name"],
                    "request": request
                })
            
            module_item["item"].append(method_item)
        
        collection["item"].append(module_item)
    
    return collection

def main():
    """Generate and save the Postman collection"""
    collection = create_postman_collection()
    
    with open("CRM_Backend_Complete_API_Collection.postman_collection.json", "w") as f:
        json.dump(collection, f, indent=2)
    
    print("✅ Complete Postman collection generated successfully!")
    print("📁 File: CRM_Backend_Complete_API_Collection.postman_collection.json")
    print(f"📊 Total modules: {len(collection['item'])}")
    
    # Count total endpoints
    total_endpoints = 0
    for module in collection["item"]:
        for method_group in module["item"]:
            total_endpoints += len(method_group["item"])
    
    print(f"🔗 Total endpoints: {total_endpoints}")

if __name__ == "__main__":
    main()
