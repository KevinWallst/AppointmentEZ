#!/bin/bash

# Run the delete API tests
echo "Running Delete API Tests..."
npx jest __tests__/delete-api.test.js --verbose

# Run the admin dashboard delete tests
echo "Running Admin Dashboard Delete Tests..."
npx jest __tests__/admin-delete.test.js --verbose
