export function isValidLicensePlate(plate: string): boolean {
  const r1 = /^[A-Z]{2}-\d{2}-\d{2}$/;
  const r2 = /^\d{2}-\d{2}-[A-Z]{2}$/;
  const r3 = /^\d{2}-[A-Z]{2}-\d{2}$/;
  const r4 = /^[A-Z]{2}-\d{2}-[A-Z]{2}$/;
  return r1.test(plate) || r2.test(plate) || r3.test(plate) || r4.test(plate);
}
