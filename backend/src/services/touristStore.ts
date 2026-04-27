import { getFirestore, isFirebaseEnabled } from './firebaseAdmin';
import type { RegisterTouristRequest, TouristProfile, TouristHotelBinding, UpdateTouristProfileRequest } from '../types/tourist';
import type { Coordinates } from '../types/incident';

const COLLECTION = 'touristProfiles';
const META_DOC = 'touristMeta/profileCounter';

const memoryStore = new Map<string, TouristProfile>();
let memorySerial = 1;

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      if (nestedValue !== undefined) {
        output[key] = stripUndefined(nestedValue);
      }
    }
    return output as T;
  }

  return value;
}

function formatDigitalId(firstName: string, lastName: string, serialNumber: number, state: string, district: string) {
  const initials = `${(firstName.trim()[0] ?? 'X').toUpperCase()}${(lastName.trim()[0] ?? 'X').toUpperCase()}`;
  const serial = String(serialNumber).padStart(2, '0');
  const stateInitial = (state.trim()[0] ?? 'X').toUpperCase();
  const districtInitial = (district.trim()[0] ?? 'X').toUpperCase();
  return `${initials}-${serial}-${stateInitial}${districtInitial}`;
}

function normalizeProfile(profile: TouristProfile): TouristProfile {
  return {
    ...profile,
    currentLocation: profile.currentLocation ?? '',
    hotelBinding: profile.hotelBinding ?? undefined,
  };
}

async function saveProfile(profile: TouristProfile): Promise<void> {
  const sanitizedProfile = stripUndefined(profile);
  if (isFirebaseEnabled()) {
    const db = getFirestore();
    if (db) {
      await db.collection(COLLECTION).doc(profile.uid).set(sanitizedProfile, { merge: true });
    }
    return;
  }

  memoryStore.set(profile.uid, profile);
}

async function allocateSerialNumber(): Promise<number> {
  if (!isFirebaseEnabled()) {
    const next = memorySerial;
    memorySerial += 1;
    return next;
  }

  const db = getFirestore();
  if (!db) return memorySerial++;

  const counterRef = db.doc(META_DOC);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const current = snapshot.exists ? Number(snapshot.data()?.nextSerial ?? 1) : 1;
    transaction.set(counterRef, { nextSerial: current + 1, updatedAt: new Date().toISOString() }, { merge: true });
    return current;
  });
}

export async function getTouristProfileByUid(uid: string): Promise<TouristProfile | undefined> {
  if (isFirebaseEnabled()) {
    const db = getFirestore();
    if (!db) return undefined;
    const doc = await db.collection(COLLECTION).doc(uid).get();
    if (!doc.exists) return undefined;
    return normalizeProfile(doc.data() as TouristProfile);
  }

  const profile = memoryStore.get(uid);
  return profile ? normalizeProfile(profile) : undefined;
}

export async function registerTouristProfile(uid: string, request: RegisterTouristRequest): Promise<TouristProfile> {
  const now = new Date().toISOString();
  const serialNumber = await allocateSerialNumber();
  const digitalId = formatDigitalId(request.touristFirstName, request.touristLastName, serialNumber, request.homeState, request.homeDistrict);

  const profile: TouristProfile = {
    uid,
    email: request.email,
    touristFirstName: request.touristFirstName.trim(),
    touristLastName: request.touristLastName.trim(),
    phoneNumber: request.phoneNumber.trim(),
    aadhaarNumber: request.aadhaarNumber.trim(),
    homeState: request.homeState.trim(),
    homeDistrict: request.homeDistrict.trim(),
    pinCode: request.pinCode.trim(),
    serialNumber,
    digitalId,
    createdAt: now,
    updatedAt: now,
  };

  await saveProfile(profile);
  return profile;
}

export async function updateTouristProfile(uid: string, request: UpdateTouristProfileRequest): Promise<TouristProfile | undefined> {
  const profile = await getTouristProfileByUid(uid);
  if (!profile) return undefined;

  const updatedAt = new Date().toISOString();
  const nextProfile: TouristProfile = {
    ...profile,
    email: request.email?.trim() || profile.email,
    touristFirstName: request.touristFirstName?.trim() || profile.touristFirstName,
    touristLastName: request.touristLastName?.trim() || profile.touristLastName,
    phoneNumber: request.phoneNumber?.trim() || profile.phoneNumber,
    aadhaarNumber: request.aadhaarNumber?.trim() || profile.aadhaarNumber,
    homeState: request.homeState?.trim() || profile.homeState,
    homeDistrict: request.homeDistrict?.trim() || profile.homeDistrict,
    pinCode: request.pinCode?.trim() || profile.pinCode,
    currentLocation: request.currentLocation ?? profile.currentLocation,
    coordinates: request.coordinates ?? profile.coordinates,
    hotelBinding: request.hotelBinding === null ? undefined : request.hotelBinding ?? profile.hotelBinding,
    updatedAt,
  };

  if (request.touristFirstName || request.touristLastName || request.homeState || request.homeDistrict) {
    nextProfile.digitalId = formatDigitalId(
      nextProfile.touristFirstName,
      nextProfile.touristLastName,
      nextProfile.serialNumber,
      nextProfile.homeState,
      nextProfile.homeDistrict
    );
  }

  await saveProfile(nextProfile);
  return nextProfile;
}

export async function updateTouristLocation(uid: string, coordinates: Coordinates, currentLocation: string): Promise<TouristProfile | undefined> {
  return updateTouristProfile(uid, {
    coordinates,
    currentLocation,
  });
}

export async function bindTouristHotel(uid: string, binding: TouristHotelBinding): Promise<TouristProfile | undefined> {
  return updateTouristProfile(uid, {
    hotelBinding: {
      ...binding,
      sharedAt: binding.sharedAt ?? new Date().toISOString(),
    },
  });
}