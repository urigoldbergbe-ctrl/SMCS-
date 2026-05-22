import SimulationClient from "./simulation-client";

interface SimulationPageProps {
  searchParams?: {
    city?: string;
    datasetType?: string;
    fleetSize?: string;
  };
}

export default function SimulationPage({ searchParams }: SimulationPageProps) {
  const initialCity = searchParams?.city ?? "tlv";
  const initialDatasetType = searchParams?.datasetType ?? "tlv_onboarding";
  const parsedFleetSize = Number(searchParams?.fleetSize ?? "16");
  const initialFleetSize = Number.isFinite(parsedFleetSize) && parsedFleetSize > 0 ? parsedFleetSize : 16;

  return (
    <SimulationClient
      initialCity={initialCity}
      initialDatasetType={initialDatasetType}
      initialFleetSize={initialFleetSize}
    />
  );
}
