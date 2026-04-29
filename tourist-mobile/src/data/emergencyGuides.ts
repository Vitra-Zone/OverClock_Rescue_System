export const EMERGENCY_GUIDES = [
  {
    id: 'fire',
    icon: '🔥',
    title: 'Fire Emergency',
    borderColor: 'border-red-700/50',
    contact: '101 (Fire) · 112 (National Emergency)',
    steps: [
      'Stay LOW. Smoke rises, so crawl if needed.',
      'Feel the door before opening. If hot, do not open it.',
      'Use the nearest stairwell. Do not use elevators.',
      'Go to the assembly point and call emergency services.',
    ],
  },
  {
    id: 'medical',
    icon: '🏥',
    title: 'Medical Emergency',
    borderColor: 'border-blue-700/50',
    contact: '108 (Ambulance) · 112 (National Emergency)',
    steps: [
      'Call hotel front desk immediately.',
      'Keep the guest calm and still.',
      'Do not give food or water until help arrives.',
      'Share the exact room number or location.',
    ],
  },
  {
    id: 'security',
    icon: '🛡️',
    title: 'Security Threat',
    borderColor: 'border-purple-700/50',
    contact: '100 (Police) · 112 (National Emergency)',
    steps: [
      'Run if you can escape safely.',
      'Hide and lock the door if you cannot run.',
      'Stay quiet and silence your phone.',
      'Call the police once you are safe.',
    ],
  },
  {
    id: 'earthquake',
    icon: '🌍',
    title: 'Earthquake',
    borderColor: 'border-amber-700/50',
    contact: '112 (National Emergency)',
    steps: [
      'Drop, cover, and hold on immediately.',
      'Keep away from windows and exterior walls.',
      'Do not run outside during the shaking.',
      'Evacuate calmly once the shaking stops.',
    ],
  },
];
