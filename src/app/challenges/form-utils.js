export function buildForm(values, file) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")));
  if (file) formData.set("banner", file);
  return formData;
}
