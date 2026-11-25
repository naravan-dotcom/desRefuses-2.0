export function entriesToFormData(entries) {
  const formData = new FormData();
  Object.entries(entries ?? {}).forEach(([key, value]) => formData.set(key, String(value ?? "")));
  return formData;
}

export function formDataWithFile(entries, file, key = "image") {
  const formData = entriesToFormData(entries);
  if (file) formData.set(key, file);
  return formData;
}
