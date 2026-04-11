/**
 * Patches react-native-worklets to skip RN version check.
 * NativeWind v4 requires the worklets Babel plugin, but the native
 * podspec rejects RN < 0.78. Since we only need the JS/Babel plugin
 * (not the native module), we patch out the version assertion.
 */
const fs = require("fs");
const path = require("path");

const filePath = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-native-worklets",
  "scripts",
  "worklets_utils.rb"
);

if (!fs.existsSync(filePath)) {
  console.log("[patch-worklets] worklets_utils.rb not found, skipping");
  process.exit(0);
}

let content = fs.readFileSync(filePath, "utf8");

const original = `def worklets_assert_minimal_react_native_version(config)
  validate_react_native_version_script = File.expand_path(File.join(__dir__, 'validate-react-native-version.js'))
  unless system("node \\"#{validate_react_native_version_script}\\" #{config[:react_native_version]}")
    raise "[Worklets] React Native version is not compatible with Worklets"
  end
end`;

const patched = `def worklets_assert_minimal_react_native_version(config)
  # Patched: skip version check for Expo SDK 52 (RN 0.76) compatibility
end`;

if (content.includes("# Patched: skip version check")) {
  console.log("[patch-worklets] Already patched, skipping");
  process.exit(0);
}

if (content.includes("worklets_assert_minimal_react_native_version")) {
  content = content.replace(
    /def worklets_assert_minimal_react_native_version\(config\)[\s\S]*?^end/m,
    patched
  );
  fs.writeFileSync(filePath, content, "utf8");
  console.log("[patch-worklets] Patched worklets_utils.rb successfully");
} else {
  console.log("[patch-worklets] Could not find function to patch");
}
