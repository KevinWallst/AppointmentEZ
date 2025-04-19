#!/bin/bash

# Test script for Chinese characters in CSV
echo "=== CHINESE CHARACTERS IN CSV TEST ==="
echo "This script will test if Chinese characters in the booking data cause CSV file corruption."

# Step 1: Clean up the environment
echo "Step 1: Cleaning up the environment..."
echo "id,appointmentTime,requestTime,name,email,wechatId,topic,language" > bookings.csv
echo "e630ceb6-7dfe-4113-ac5f-ff38ad3039f4,2025-04-24T13:00:00.000Z,2025-04-18T06:04:20.966Z,Kevin,kevinwallst@yahoo.com,k,9,zh" >> bookings.csv
echo "CSV file reset to a clean state with one booking."

# Step 2: Restart the server
echo "Step 2: Restarting the server..."
./start-server-3000.sh
echo "Server restarted."

# Step 3: Open the admin dashboard
echo "Step 3: Opening the admin dashboard..."
echo "Please login with username: admin, password: notpassword"
echo "Then follow these steps:"
echo "1. Select a date in the calendar (e.g., April 22, 2025)"
echo "2. Click on an available time slot (green)"
echo "3. Fill in the booking form with Chinese characters:"
echo "   - Name: 测试用户 (Test User in Chinese)"
echo "   - Email: test@example.com"
echo "   - WeChat ID: test-wechat"
echo "   - Topic: 中文测试主题 (Chinese Test Topic)"
echo "4. Click the Save button"
echo "5. Wait for the success message"
echo "6. Click the Cancel button to close the modal"
echo "7. Verify that no error occurs and the dashboard refreshes"

# Step 4: Open the browser
echo "Step 4: Opening the browser..."
open http://localhost:3000/admin/login

# Step 5: Check the CSV file after the test
echo "Step 5: After completing the test, check the CSV file for corruption..."
echo "Run the following command to check the CSV file:"
echo "cat bookings.csv"

echo "=== TEST COMPLETE ==="
echo "Please report any errors or issues you encounter."
