import AdminMaterialsClient from "@/components/materials/AdminMaterialsClient";

export const dynamic = "force-dynamic";

export default function MaterialsAdminPage() {
  return (
    <section className="bg-grain px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <AdminMaterialsClient />
      </div>
    </section>
  );
}
