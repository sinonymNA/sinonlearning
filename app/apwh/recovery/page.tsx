import type { Metadata } from "next";
import ApwhRecoveryForm from "@/components/apwh/ApwhRecoveryForm";

export const metadata: Metadata = {
  title: "APWH Owner Recovery",
  robots: { index: false, follow: false },
};

export default function ApwhRecoveryPage() {
  return <ApwhRecoveryForm />;
}
