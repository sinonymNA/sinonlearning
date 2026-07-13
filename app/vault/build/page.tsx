import type { Metadata } from "next";
import VaultSetBuilder from "@/components/vault/VaultSetBuilder";

export const metadata: Metadata = { title: "Build a Question Set — The Vault" };

export default function VaultBuildPage() {
  return <VaultSetBuilder />;
}
