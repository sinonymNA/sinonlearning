import type { Metadata } from "next";
import VaultGame from "@/components/vault/VaultGame";

export const metadata: Metadata = {
  title: "The Vault: First Descent",
  description: "Descend into an endless vault where knowledge opens every door.",
};

export default function VaultPage() {
  return <VaultGame />;
}
