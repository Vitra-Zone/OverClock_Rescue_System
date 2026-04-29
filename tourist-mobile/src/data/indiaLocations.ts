export interface IndiaStateOption {
  code: string;
  name: string;
}

export const INDIA_STATES: IndiaStateOption[] = [
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CT', name: 'Chhattisgarh' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OD', name: 'Odisha' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TG', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UT', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'DL', name: 'Delhi' },
];

const DISTRICT_MAP: Record<string, string[]> = {
  'Andhra Pradesh': ['Alluri Sitharama Raju', 'Anakapalli', 'Chittoor', 'Guntur', 'Kurnool', 'Krishna', 'NTR', 'Visakhapatnam'],
  'Assam': ['Bongaigaon', 'Cachar', 'Dibrugarh', 'Kamrup', 'Kamrup Metropolitan', 'Jorhat', 'Sivasagar', 'Tinsukia'],
  'Bihar': ['Araria', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Darbhanga', 'Gaya', 'Muzaffarpur', 'Patna'],
  'Gujarat': ['Ahmedabad', 'Anand', 'Bhavnagar', 'Gandhinagar', 'Jamnagar', 'Rajkot', 'Surat', 'Vadodara'],
  'Karnataka': ['Bengaluru Urban', 'Dakshina Kannada', 'Dharwad', 'Mysuru', 'Mangaluru', 'Udupi', 'Tumakuru', 'Shivamogga'],
  'Kerala': ['Alappuzha', 'Ernakulam', 'Idukki', 'Kozhikode', 'Kollam', 'Kottayam', 'Thiruvananthapuram', 'Thrissur'],
  'Maharashtra': ['Ahmednagar', 'Aurangabad', 'Kolhapur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nashik', 'Pune'],
  'Rajasthan': ['Ajmer', 'Alwar', 'Bikaner', 'Jaipur', 'Jodhpur', 'Kota', 'Udaipur', 'Sikar'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Cuddalore', 'Madurai', 'Salem', 'Thanjavur', 'Tiruchirappalli', 'Tirunelveli'],
  'Telangana': ['Hyderabad', 'Karimnagar', 'Khammam', 'Medchal Malkajgiri', 'Nizamabad', 'Rangareddy', 'Warangal', 'Sangareddy'],
  'Uttar Pradesh': ['Agra', 'Aligarh', 'Bareilly', 'Ghaziabad', 'Gorakhpur', 'Kanpur Nagar', 'Lucknow', 'Varanasi'],
  'West Bengal': ['Bankura', 'Darjeeling', 'Hooghly', 'Howrah', 'Kolkata', 'Murshidabad', 'Nadia', 'North 24 Parganas'],
};

export function getIndiaDistricts(stateValue: string): string[] {
  return DISTRICT_MAP[stateValue] ?? ['General'];
}
