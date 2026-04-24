export function sameUser(a: string | number | undefined | null, b: string | number | undefined | null): boolean {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

export function getCityName(id: number | string, citiesData: any[]): string {
  const city = citiesData.find((c: any) => c.id.toString() === id.toString());
  return city ? city.name : '...';
}

export function getVehicleObj(vehicleInfo: string | null | undefined): { brand: string; plate: string } {
  if (!vehicleInfo) return { brand: '', plate: '' };
  try {
    const parsed = JSON.parse(vehicleInfo);
    if (parsed.brand !== undefined) return parsed;
    return { brand: vehicleInfo, plate: '' };
  } catch {
    return { brand: vehicleInfo, plate: '' };
  }
}

export function getTripVehicleString(t: any): string {
  if (t.type !== 'PROVIDER') return '';
  const fallback = t.vehicleType || 'Viatura';
  const infoStr = t.vehicleType === 'Viatura Pessoal'
    ? (t.creator?.vehicleInfo || t.tripVehicleDetails)
    : t.tripVehicleDetails;
  if (!infoStr) return fallback;
  try {
    const v = JSON.parse(infoStr);
    return `${v.brand || ''} ${v.plate ? `- ${v.plate}` : ''}`.trim() || fallback;
  } catch {
    return infoStr;
  }
}
