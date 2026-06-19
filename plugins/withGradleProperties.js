const { withGradleProperties } = require("@expo/config-plugins");

module.exports = function withGradlePropertiesModification(config) {
  return withGradleProperties(config, (config) => {
    const properties = config.modResults;
    
    const jvmArgs = "-Xmx4096m -XX:MaxMetaspaceSize=1024m";
    const existing = properties.find((p) => p.key === "org.gradle.jvmargs");
    
    if (existing) {
      existing.value = jvmArgs;
    } else {
      properties.push({ type: "property", key: "org.gradle.jvmargs", value: jvmArgs });
    }
    
    return config;
  });
};
