-- Create a test hostel for the owner
INSERT INTO hostels (id, name, owner_id, address, city, phone, email, total_rooms, total_beds, occupied_beds, monthly_revenue, status, facilities)
VALUES ('h_test', 'Test Hostel', 'u_owner', '123 Test Street', 'Lahore', '03001234567', 'test@hostel.com', 10, 30, 0, 0, 'active', '{"wifi": true, "parking": true}');

-- Create the owner user
INSERT INTO users (id, name, email, password_hash, role, hostel_id, permissions)
VALUES ('u_owner', 'Abdul Wajid', 'abdulwajid9997@gmail.com', '$2a$10$Leb6/6vCL.01Y/Uj0yH.TOgOGfvvUexYmj4zi0f2Clu.donoXcyxq', 'owner', 'h_test', '["manage_rooms", "manage_tenants", "manage_payments", "manage_maintenance", "manage_staff"]');
