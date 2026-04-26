import type { ConnectivityMode } from '../types/incident';
import { SOSScreen } from './SOSScreen';

interface Props {
  connectivity: ConnectivityMode;
}

export function GuestPortalPage({ connectivity }: Props) {
  return <SOSScreen connectivity={connectivity} showBackButton={false} afterSubmitFlow="guides-map" />;
}
