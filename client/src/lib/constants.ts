// App information
export const APP_NAME = "Road Buddies";
export const APP_DESCRIPTION = "A app de carsharing da LOBA";
export const APP_VERSION = "1.0.0";

export const TRIP_STATUS = {
  PROVIDER: "PROVIDER", // Definitely providing vehicle
  // FLEXIBLE: "FLEXIBLE", // Can provide if needed (TEMPORARILY DISABLED)
  NEEDRIDE: "NEEDRIDE", // Need a ride
};

// Defina TRIP_STATUS_FLEXIBLE para uso nos comentários, para evitar erros de tipagem
const TRIP_STATUS_FLEXIBLE = "FLEXIBLE"; // Isso é apenas para referência nos comentários

// Rótulos dos status de viagem (texto)
export const TRIP_STATUS_LABELS = {
  [TRIP_STATUS.PROVIDER]: "Levo Carro",
  // Temporariamente desativado, mas mantido como comentário
  // ["FLEXIBLE"]: "Flexível",
  [TRIP_STATUS.NEEDRIDE]: "Preciso de Boleia"
};

// Cores CSS dos badges de status
export const TRIP_STATUS_COLORS = {
  [TRIP_STATUS.PROVIDER]: "provider-badge",
  // Temporariamente desativado, mas mantido como comentário
  // ["FLEXIBLE"]: "flexible-badge",
  [TRIP_STATUS.NEEDRIDE]: "needride-badge"
};

// Ícones para os status de viagem
export const TRIP_STATUS_ICONS = {
  [TRIP_STATUS.PROVIDER]: "car",
  [TRIP_STATUS.NEEDRIDE]: "footprints"
};

// Mock cities in Portugal for the demo
export const PORTUGAL_CITIES = [
  { name: "Lisboa", lat: "38.7223", lng: "-9.1393" },
  { name: "Porto", lat: "41.1579", lng: "-8.6291" },
  { name: "Faro", lat: "37.0193", lng: "-7.9304" },
  { name: "Coimbra", lat: "40.2033", lng: "-8.4103" },
  { name: "Braga", lat: "41.5454", lng: "-8.4265" },
  { name: "Aveiro", lat: "40.6405", lng: "-8.6538" },
  { name: "Setúbal", lat: "38.5244", lng: "-8.8935" },
  { name: "Évora", lat: "38.5714", lng: "-7.9135" },
  { name: "Beja", lat: "38.0153", lng: "-7.8632" },
  { name: "Viseu", lat: "40.6566", lng: "-7.9125" }
];
