import type { ConnectivityMode } from '../types/incident';
import { TouristPortalPage } from './TouristPortalPage';

interface Props {
  connectivity: ConnectivityMode;
}

export function GuestPortalPage({ connectivity }: Props) {
  void connectivity;
  return <TouristPortalPage />;
}
