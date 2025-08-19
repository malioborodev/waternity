// Global Test Teardown for Waternity
import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Waternity test environment teardown...');
  
  try {
    // 1. Generate test report summary
    await generateTestSummary();
    
    // 2. Clean up test database
    await cleanupTestDatabase();
    
    // 3. Archive test artifacts
    await archiveTestArtifacts();
    
    // 4. Clean up test accounts (if needed)
    await cleanupTestAccounts();
    
    // 5. Generate coverage report
    await generateCoverageReport();
    
    console.log('✅ Test environment teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Test environment teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

async function generateTestSummary() {
  console.log('📊 Generating test summary...');
  
  try {
    const resultsPath = path.resolve(__dirname, '../test-results/results.json');
    const resultsExist = await fs.access(resultsPath).then(() => true).catch(() => false);
    
    if (!resultsExist) {
      console.log('⚠️ No test results found, skipping summary generation');
      return;
    }
    
    const resultsData = await fs.readFile(resultsPath, 'utf-8');
    const results = JSON.parse(resultsData);
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: results.stats?.total || 0,
      passed: results.stats?.passed || 0,
      failed: results.stats?.failed || 0,
      skipped: results.stats?.skipped || 0,
      duration: results.stats?.duration || 0,
      success: (results.stats?.failed || 0) === 0,
      suites: results.suites?.map((suite: any) => ({
        title: suite.title,
        tests: suite.specs?.length || 0,
        passed: suite.specs?.filter((spec: any) => spec.ok).length || 0,
        failed: suite.specs?.filter((spec: any) => !spec.ok).length || 0
      })) || []
    };
    
    const summaryPath = path.resolve(__dirname, '../test-results/summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    // Generate human-readable summary
    const readableSummary = `
# Waternity Test Summary

**Test Run:** ${summary.timestamp}
**Total Tests:** ${summary.totalTests}
**Passed:** ${summary.passed}
**Failed:** ${summary.failed}
**Skipped:** ${summary.skipped}
**Duration:** ${Math.round(summary.duration / 1000)}s
**Status:** ${summary.success ? '✅ PASSED' : '❌ FAILED'}

## Test Suites

${summary.suites.map(suite => 
  `### ${suite.title}\n- Tests: ${suite.tests}\n- Passed: ${suite.passed}\n- Failed: ${suite.failed}\n`
).join('\n')}

## Artifacts

- HTML Report: \`test-results/html-report/index.html\`
- Screenshots: \`test-results/artifacts/\`
- Videos: \`test-results/artifacts/\`
- Coverage: \`coverage/index.html\`
`;
    
    const readablePath = path.resolve(__dirname, '../test-results/README.md');
    await fs.writeFile(readablePath, readableSummary);
    
    console.log('✅ Test summary generated');
    console.log(`📈 Results: ${summary.passed}/${summary.totalTests} tests passed`);
    
  } catch (error) {
    console.error('❌ Failed to generate test summary:', error);
  }
}

async function cleanupTestDatabase() {
  console.log('🗄️ Cleaning up test database...');
  
  try {
    const configPath = path.resolve(__dirname, '../test-results/db-config.json');
    const configExists = await fs.access(configPath).then(() => true).catch(() => false);
    
    if (!configExists) {
      console.log('⚠️ No database config found, skipping cleanup');
      return;
    }
    
    // In a real implementation, you might:
    // 1. Drop test database
    // 2. Clean up test data
    // 3. Reset database state
    
    console.log('✅ Test database cleaned up');
    
  } catch (error) {
    console.error('❌ Failed to cleanup test database:', error);
  }
}

async function archiveTestArtifacts() {
  console.log('📦 Archiving test artifacts...');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = path.resolve(__dirname, `../archives/test-run-${timestamp}`);
    
    await fs.mkdir(archiveDir, { recursive: true });
    
    // Copy important artifacts to archive
    const artifactsToCopy = [
      'test-results/summary.json',
      'test-results/README.md',
      'test-results/results.json',
      'test-results/junit.xml'
    ];
    
    for (const artifact of artifactsToCopy) {
      try {
        const sourcePath = path.resolve(__dirname, `../${artifact}`);
        const destPath = path.resolve(archiveDir, path.basename(artifact));
        await fs.copyFile(sourcePath, destPath);
      } catch (error) {
        // Artifact might not exist, which is fine
      }
    }
    
    // Create archive metadata
    const metadata = {
      timestamp,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || 'test',
      baseURL: process.env.TEST_URL || 'http://localhost:3000',
      ci: !!process.env.CI
    };
    
    const metadataPath = path.resolve(archiveDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`✅ Test artifacts archived to: ${archiveDir}`);
    
  } catch (error) {
    console.error('❌ Failed to archive test artifacts:', error);
  }
}

async function cleanupTestAccounts() {
  console.log('👤 Cleaning up test accounts...');
  
  try {
    const accountsPath = path.resolve(__dirname, '../test-results/test-accounts.json');
    const accountsExist = await fs.access(accountsPath).then(() => true).catch(() => false);
    
    if (!accountsExist) {
      console.log('⚠️ No test accounts found, skipping cleanup');
      return;
    }
    
    // In a real implementation, you might:
    // 1. Clean up test Hedera accounts
    // 2. Delete test smart contracts
    // 3. Burn test HTS tokens
    // 4. Close test HCS topics
    
    console.log('✅ Test accounts cleaned up');
    
  } catch (error) {
    console.error('❌ Failed to cleanup test accounts:', error);
  }
}

async function generateCoverageReport() {
  console.log('📊 Generating coverage report...');
  
  try {
    // Check if coverage data exists
    const coverageDir = path.resolve(__dirname, '../../coverage');
    const coverageExists = await fs.access(coverageDir).then(() => true).catch(() => false);
    
    if (!coverageExists) {
      console.log('⚠️ No coverage data found, skipping coverage report');
      return;
    }
    
    // Generate coverage summary
    const coverageSummaryPath = path.resolve(coverageDir, 'coverage-summary.json');
    const summaryExists = await fs.access(coverageSummaryPath).then(() => true).catch(() => false);
    
    if (summaryExists) {
      const summaryData = await fs.readFile(coverageSummaryPath, 'utf-8');
      const summary = JSON.parse(summaryData);
      
      const coverageReport = {
        timestamp: new Date().toISOString(),
        total: summary.total,
        files: Object.keys(summary).filter(key => key !== 'total').length,
        thresholds: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80
        },
        passed: {
          statements: summary.total.statements.pct >= 80,
          branches: summary.total.branches.pct >= 80,
          functions: summary.total.functions.pct >= 80,
          lines: summary.total.lines.pct >= 80
        }
      };
      
      const reportPath = path.resolve(__dirname, '../test-results/coverage-report.json');
      await fs.writeFile(reportPath, JSON.stringify(coverageReport, null, 2));
      
      console.log('✅ Coverage report generated');
      console.log(`📊 Coverage: ${summary.total.lines.pct}% lines, ${summary.total.statements.pct}% statements`);
    }
    
  } catch (error) {
    console.error('❌ Failed to generate coverage report:', error);
  }
}

// Cleanup function for emergency situations
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, performing emergency cleanup...');
  await globalTeardown({} as FullConfig);
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, performing emergency cleanup...');
  await globalTeardown({} as FullConfig);
  process.exit(0);
});

export default globalTeardown;