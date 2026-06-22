import { Suspense } from "react";
import DocumentGeneratorPage from "@/views/documents/DocumentGeneratorPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DocumentGeneratorPage />
    </Suspense>
  );
}
