const tailwind = require("tailwindcss")("./tailwind.config.js");
const autoprefixer = require("autoprefixer");

module.exports = {
  // eslint-disable-next-line no-process-env
  plugins: [
    tailwind,
    ...(process.env.HUGO_ENVIRONMENT === "production" ? [autoprefixer] : []),
  ],
};
