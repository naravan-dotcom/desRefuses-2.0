import { formDataWithFile } from "@/lib/form-data";

export function buildForm(values, file) {
  return formDataWithFile(values, file, "banner");
}
