import semver from 'semver';
import fs from 'fs';
import {$} from 'zx';

$.prefix = 'export NVM_DIR=$HOME/.nvm; source $NVM_DIR/nvm.sh; set -e;'

async function getAllNodeVersions() {
  const output = await $`nvm list-remote --no-colors`;
  return output.stdout.split('\n')
                      .map(line => line.trim().match(/v(\d+\.\d+\.\d+)/))
                      .filter(Boolean)
                      .map(match => match[1])
                      .filter(version => semver.gte(version, '16.0.0'));  // Start from 16.0.0
}

async function testNodeVersions(versions) {
  const results = [];

  for (const version of versions) {
    try {
      await $`nvm exec ${version} npm test -- --disable-coverage`;
      results.push({ version, success: true });
      console.log(`Version ${version} tested successfully.`);
    } catch (err) {
      console.log(`Version ${version} failed tests or not available.`);
      results.push({ version, success: false });
    }
  }

  return results;
}

function createSemverRange(testResults) {
  let ranges = [];
  let lastGood = null;

  testResults.forEach((result, index) => {
    if (result.success) {
      if (!lastGood) {
        lastGood = result.version; // Start of a new range
      }
      // If it's the last version or the next version is not successful, close the range
      if (index === testResults.length - 1 || !testResults[index + 1].success) {
        if (lastGood === result.version) {
          ranges.push(lastGood); // Single version
        } else {
          ranges.push(`${lastGood} - ${result.version}`); // Range from lastGood to current version
        }
        lastGood = null; // Reset for next range
      }
    }
  });

  return ranges.length > 0 ? ranges.join(' || ') : "No successful versions";
}

(async () => {
  const allVersions = await getAllNodeVersions();
  const testResults = await testNodeVersions(allVersions);
  fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
  const semverRange = createSemverRange(testResults);
  console.log(`Valid semver range for engines in package.json: "${semverRange}"`);
})();