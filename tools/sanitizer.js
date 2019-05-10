// replace spaces with underscore and remove anything besides
// alphanumerics, underscores, dots, and dashes
module.exports = function sanitize (str) {
  if (!str) return str

  return str.trim().replace(/[^\w\s.-]/g, '').replace(/\s+/g, '_')
}
