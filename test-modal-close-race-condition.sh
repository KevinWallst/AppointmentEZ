#!/bin/bash

# Test script for modal close race condition
echo "=== MODAL CLOSE RACE CONDITION TEST ==="
echo "This script will test the modal close race condition to verify that the 'Time slot is already booked' error is fixed."

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
echo "1. Open the browser console (F12)"
echo "2. Select a date in the calendar (e.g., April 22, 2025)"
echo "3. Click on an available time slot (green)"
echo "4. Fill in the booking form:"
echo "   - Name: Test User"
echo "   - Email: test@example.com"
echo "   - WeChat ID: test-wechat"
echo "   - Topic: Test Booking"
echo "5. Click the Cancel button to close the modal"
echo "6. Quickly click the Save button before the modal is fully closed"
echo "7. Check the console for the following logs:"
echo "   - '=== MODAL CLOSE TRIGGERED ===' (orange background)"
echo "   - 'Set __modalCloseInProgress flag to true'"
echo "   - '=== MODAL CLOSE IN PROGRESS, ABORTING SAVE ===' (red background)"
echo "   - 'Set __modalCloseInProgress flag to false'"
echo "8. Verify that no error occurs and the dashboard refreshes"

# Step 4: Open the browser
echo "Step 4: Opening the browser..."
open http://localhost:3000/admin/login

echo "=== TEST COMPLETE ==="
echo "Please report any errors or issues you encounter."
