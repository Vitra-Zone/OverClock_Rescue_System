interface Props {
  loading?: boolean;
  onClick: () => void;
}

export function SOSButton({ loading = false, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full rounded-3xl bg-red-600 px-6 py-4 text-lg font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:opacity-60"
    >
      {loading ? 'Sending SOS...' : 'EMERGENCY SOS'}
    </button>
  );
}
