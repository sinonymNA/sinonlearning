import { use } from "react";
import KoraGameHost from "@/components/game/KoraGameHost";

interface Props {
  params: Promise<{ code: string }>;
}

export default function HostPage({ params }: Props) {
  const { code } = use(params);
  return <KoraGameHost code={code} />;
}
