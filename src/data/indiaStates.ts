export interface StateOption {
  name: string;
  code: string;
  countryCode: string;
}

export const indiaStates: StateOption[] = [
  { name: "Andaman and Nicobar Islands", code: "AN", countryCode: "IN" },
  { name: "Andhra Pradesh", code: "AP", countryCode: "IN" },
  { name: "Arunachal Pradesh", code: "AR", countryCode: "IN" },
  { name: "Assam", code: "AS", countryCode: "IN" },
  { name: "Bihar", code: "BR", countryCode: "IN" },
  { name: "Chhattisgarh", code: "CG", countryCode: "IN" },
  { name: "Chandigarh", code: "CH", countryCode: "IN" },
  { name: "Dadra and Nagar Haveli", code: "DN", countryCode: "IN" },
  { name: "Daman and Diu", code: "DD", countryCode: "IN" },
  { name: "Delhi", code: "DL", countryCode: "IN" },
  { name: "Goa", code: "GA", countryCode: "IN" },
  { name: "Gujarat", code: "GJ", countryCode: "IN" },
  { name: "Haryana", code: "HR", countryCode: "IN" },
  { name: "Himachal Pradesh", code: "HP", countryCode: "IN" },
  { name: "Jammu and Kashmir", code: "JK", countryCode: "IN" },
  { name: "Jharkhand", code: "JH", countryCode: "IN" },
  { name: "Karnataka", code: "KA", countryCode: "IN" },
  { name: "Kerala", code: "KL", countryCode: "IN" },
  { name: "Ladakh", code: "LA", countryCode: "IN" },
  { name: "Lakshadweep", code: "LD", countryCode: "IN" },
  { name: "Madhya Pradesh", code: "MP", countryCode: "IN" },
  { name: "Maharashtra", code: "MH", countryCode: "IN" },
  { name: "Manipur", code: "MN", countryCode: "IN" },
  { name: "Meghalaya", code: "ML", countryCode: "IN" },
  { name: "Mizoram", code: "MZ", countryCode: "IN" },
  { name: "Nagaland", code: "NL", countryCode: "IN" },
  { name: "Odisha", code: "OD", countryCode: "IN" },
  { name: "Puducherry", code: "PY", countryCode: "IN" },
  { name: "Punjab", code: "PB", countryCode: "IN" },
  { name: "Rajasthan", code: "RJ", countryCode: "IN" },
  { name: "Sikkim", code: "SK", countryCode: "IN" },
  { name: "Tamil Nadu", code: "TN", countryCode: "IN" },
  { name: "Telangana", code: "TG", countryCode: "IN" },
  { name: "Tripura", code: "TR", countryCode: "IN" },
  { name: "Uttar Pradesh", code: "UP", countryCode: "IN" },
  { name: "Uttarakhand", code: "UK", countryCode: "IN" },
  { name: "West Bengal", code: "WB", countryCode: "IN" }
];

const statesByCountry: Record<string, StateOption[]> = {
  IN: indiaStates
};

export function statesForCountry(countryCode: string): StateOption[] {
  return statesByCountry[countryCode] || [];
}
