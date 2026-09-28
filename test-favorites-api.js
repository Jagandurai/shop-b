/**
 * Manual API Test for Favorites Endpoints
 *
 * This script tests the favorite API endpoints manually.
 * Run with: node test-favorites-api.js
 *
 * Prerequisites:
 * - Backend server must be running on PORT (default 5000)
 * - MongoDB must be connected
 * - At least one image must exist in the database
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api/gallery';
const TEST_EMAIL = 'test-user@example.com';

// Helper to make authenticated requests
const authenticatedRequest = (method, url, data = null) => {
  const config = {
    method,
    url: `${API_URL}${url}`,
    headers: {
      'x-user-email': TEST_EMAIL,
    },
  };

  if (data !== null) {
    config.data = data;
    config.headers['Content-Type'] = 'application/json';
  }

  return axios(config);
};

async function testFavoritesAPI() {
  console.log('Starting Favorites API Tests...\n');

  try {
    // First, get an image to work with
    console.log('--- Step 1: Get an image ---');
    const imagesRes = await axios.get(`${API_URL}?limit=1`);
    const testImage = imagesRes.data.data[0];
    
    if (!testImage) {
      console.error('✗ No images found. Please upload an image first.');
      process.exit(1);
    }
    
    const imageId = testImage.id || testImage._id;
    console.log(`✓ Found test image: ${imageId}\n`);

    // Test 1: Get favorites (should be empty initially)
    console.log('--- Test 1: Get user favorites (empty) ---');
    try {
      const favoritesRes = await authenticatedRequest('GET', '/favorites');
      console.log('✓ GET /favorites response:', favoritesRes.data);
      console.log(`✓ Favorites count: ${favoritesRes.data.data.length}\n`);
    } catch (error) {
      console.error('✗ Failed to get favorites:', error.response?.data || error.message);
    }

    // Test 2: Add favorite
    console.log('--- Test 2: Add image to favorites ---');
    try {
      const addRes = await authenticatedRequest('POST', `/${imageId}/favorite`);
      console.log('✓ POST /:id/favorite response:', addRes.data);
    } catch (error) {
      console.error('✗ Failed to add favorite:', error.response?.data || error.message);
    }

    // Test 3: Get favorites (should have 1)
    console.log('\n--- Test 3: Get user favorites (should have 1) ---');
    try {
      const favoritesRes = await authenticatedRequest('GET', '/favorites');
      console.log('✓ GET /favorites response:', favoritesRes.data);
      console.log(`✓ Favorites count: ${favoritesRes.data.data.length}`);
      if (favoritesRes.data.data.includes(imageId)) {
        console.log('✓ Image is in favorites\n');
      } else {
        console.log('✗ Image not found in favorites\n');
      }
    } catch (error) {
      console.error('✗ Failed to get favorites:', error.response?.data || error.message);
    }

    // Test 4: Try to add duplicate favorite
    console.log('--- Test 4: Try to add duplicate favorite ---');
    try {
      const duplicateRes = await authenticatedRequest('POST', `/${imageId}/favorite`);
      console.log('✗ Duplicate favorite was allowed (should have failed):', duplicateRes.data);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✓ Duplicate favorite prevented (409 Conflict)\n');
      } else {
        console.error('✗ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test 5: Remove favorite
    console.log('--- Test 5: Remove image from favorites ---');
    try {
      const removeRes = await authenticatedRequest('DELETE', `/${imageId}/favorite`);
      console.log('✓ DELETE /:id/favorite response:', removeRes.data);
    } catch (error) {
      console.error('✗ Failed to remove favorite:', error.response?.data || error.message);
    }

    // Test 6: Get favorites (should be empty again)
    console.log('\n--- Test 6: Get user favorites (empty again) ---');
    try {
      const favoritesRes = await authenticatedRequest('GET', '/favorites');
      console.log('✓ GET /favorites response:', favoritesRes.data);
      console.log(`✓ Favorites count: ${favoritesRes.data.data.length}\n`);
    } catch (error) {
      console.error('✗ Failed to get favorites:', error.response?.data || error.message);
    }

    // Test 7: Try to remove non-existent favorite
    console.log('--- Test 7: Try to remove non-existent favorite ---');
    try {
      const removeRes = await authenticatedRequest('DELETE', `/${imageId}/favorite`);
      console.log('✗ Non-existent favorite removal succeeded (should have failed):', removeRes.data);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✓ Non-existent favorite removal prevented (404 Not Found)\n');
      } else {
        console.error('✗ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test 8: Test with invalid image ID
    console.log('--- Test 8: Test with invalid image ID ---');
    try {
      const invalidRes = await authenticatedRequest('POST', `/invalid-id/favorite`);
      console.log('✗ Invalid image ID was accepted (should have failed):', invalidRes.data);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✓ Invalid image ID rejected (400 Bad Request)\n');
      } else {
        console.error('✗ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test 9: Test without authentication
    console.log('--- Test 9: Test without authentication ---');
    try {
      const noAuthRes = await axios.post(`${API_URL}/${imageId}/favorite`);
      console.log('✗ Unauthenticated request succeeded (should have failed):', noAuthRes.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ Unauthenticated request rejected (401 Unauthorized)\n');
      } else {
        console.error('✗ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('=== All API tests completed ===');
  } catch (error) {
    console.error('✗ Test setup error:', error.message);
    process.exit(1);
  }
}

// Check if backend is running
testFavoritesAPI().catch(error => {
  console.error('✗ Test failed:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.error('✗ Backend server is not running. Please start it with: npm run dev');
  }
  process.exit(1);
});
