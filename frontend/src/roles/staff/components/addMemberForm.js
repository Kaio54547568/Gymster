export function validateAddMemberAccount(form = {}) {
  const errors = {};
  const email = String(form.email || "").trim();
  if (!email) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address";
  }
  if (String(form.password || "") && String(form.password).length < 8) {
    errors.password = "Password must be at least 8 characters";
  }
  return errors;
}
