/**
 * Test Script for Video Queue API
 * Run this to verify the implementation works correctly
 */

const API_URL = process.env.API_URL || 'http://localhost:4000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-test-token-here';

async function testVideoQueueAPI() {
  console.log('🧪 Testing Video Queue API Implementation\n');

  const tests = [
    {
      name: 'Basic Queue Request',
      url: `${API_URL}/admin/video-moderation/queue`,
      validate: (data) => {
        return data.data && Array.isArray(data.data) && data.pagination;
      },
    },
    {
      name: 'Pagination - Page 1',
      url: `${API_URL}/admin/video-moderation/queue?page=1&limit=10`,
      validate: (data) => {
        return data.pagination.page === 1 && data.pagination.per_page === 10;
      },
    },
    {
      name: 'Pagination - Page 2',
      url: `${API_URL}/admin/video-moderation/queue?page=2&limit=5`,
      validate: (data) => {
        return data.pagination.page === 2 && data.pagination.per_page === 5;
      },
    },
    {
      name: 'Filter by Severity',
      url: `${API_URL}/admin/video-moderation/queue?severity=high,critical`,
      validate: (data) => {
        return data.data.every(item => 
          item.priority === 'high' || item.priority === 'critical'
        );
      },
    },
    {
      name: 'Filter by Status',
      url: `${API_URL}/admin/video-moderation/queue?status=pending`,
      validate: (data) => {
        return data.data.every(item => item.status === 'pending');
      },
    },
    {
      name: 'Live Videos Only',
      url: `${API_URL}/admin/video-moderation/queue?isLive=true`,
      validate: (data) => {
        return data.data.every(item => item._legacy?.isLive === true);
      },
    },
    {
      name: 'Alias Endpoint (flagged-videos)',
      url: `${API_URL}/admin/video-moderation/flagged-videos?page=1`,
      validate: (data) => {
        return data.data && data.pagination;
      },
    },
    {
      name: 'Field Naming Validation',
      url: `${API_URL}/admin/video-moderation/queue?limit=1`,
      validate: (data) => {
        if (data.data.length === 0) return true;
        const item = data.data[0];
        return (
          'video_id' in item &&
          'user_id' in item &&
          'match_id' in item &&
          'duration_sec' in item &&
          'created_at' in item &&
          'ai_scores' in item &&
          'flags' in item &&
          'priority' in item &&
          'context' in item &&
          Array.isArray(item.flags) &&
          typeof item.ai_scores === 'object' &&
          'nudity' in item.ai_scores &&
          'explicit_audio' in item.ai_scores &&
          'violence' in item.ai_scores &&
          'deepfake' in item.ai_scores
        );
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      process.stdout.write(`Testing: ${test.name}... `);
      
      const response = await fetch(test.url, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log(`❌ FAILED (HTTP ${response.status})`);
        const error = await response.text();
        console.log(`  Error: ${error}\n`);
        failed++;
        continue;
      }

      const data = await response.json();
      
      if (test.validate(data)) {
        console.log('✅ PASSED');
        passed++;
      } else {
        console.log('❌ FAILED (Validation)');
        console.log('  Response:', JSON.stringify(data, null, 2).slice(0, 500));
        failed++;
      }
    } catch (error) {
      console.log(`❌ FAILED (${error.message})`);
      failed++;
    }
  }

  console.log('\n📊 Test Results:');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  Total: ${tests.length}`);
  console.log(`  Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }

  return failed === 0;
}

// Example: Test individual video item structure
async function testVideoItemStructure() {
  console.log('\n🔍 Testing Video Item Structure\n');

  try {
    const response = await fetch(
      `${API_URL}/admin/video-moderation/queue?limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
      }
    );

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const item = data.data[0];
      console.log('Sample Video Item:');
      console.log(JSON.stringify(item, null, 2));
      
      console.log('\n✅ Required Fields Check:');
      const requiredFields = [
        'video_id',
        'user_id',
        'status',
        'priority',
        'ai_scores',
        'flags',
        'context',
      ];
      
      requiredFields.forEach(field => {
        const exists = field in item;
        console.log(`  ${exists ? '✅' : '❌'} ${field}: ${exists ? '✓' : 'Missing'}`);
      });
    } else {
      console.log('⚠️  No videos in queue to test');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Example: Test pagination math
async function testPaginationMath() {
  console.log('\n🔢 Testing Pagination Math\n');

  try {
    // Get first page
    const page1 = await fetch(
      `${API_URL}/admin/video-moderation/queue?page=1&limit=5`,
      { headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` } }
    ).then(r => r.json());

    console.log('Page 1:');
    console.log(`  Total items: ${page1.pagination.total}`);
    console.log(`  Items on this page: ${page1.data.length}`);
    console.log(`  Per page: ${page1.pagination.per_page}`);
    console.log(`  Has more: ${page1.pagination.has_more}`);

    if (page1.pagination.has_more) {
      const page2 = await fetch(
        `${API_URL}/admin/video-moderation/queue?page=2&limit=5`,
        { headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` } }
      ).then(r => r.json());

      console.log('\nPage 2:');
      console.log(`  Items on this page: ${page2.data.length}`);
      console.log(`  Page number: ${page2.pagination.page}`);
      
      // Verify no overlap
      const page1Ids = new Set(page1.data.map(v => v.video_id));
      const page2Ids = new Set(page2.data.map(v => v.video_id));
      const overlap = [...page1Ids].filter(id => page2Ids.has(id));
      
      if (overlap.length === 0) {
        console.log('  ✅ No ID overlap between pages');
      } else {
        console.log(`  ❌ Found ${overlap.length} duplicate IDs`);
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run all tests
async function main() {
  console.log('='.repeat(60));
  console.log('VIDEO QUEUE API TEST SUITE');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`Using token: ${AUTH_TOKEN.slice(0, 20)}...`);
  console.log('='.repeat(60));
  console.log();

  const success = await testVideoQueueAPI();
  await testVideoItemStructure();
  await testPaginationMath();

  console.log('\n' + '='.repeat(60));
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testVideoQueueAPI,
  testVideoItemStructure,
  testPaginationMath,
};
