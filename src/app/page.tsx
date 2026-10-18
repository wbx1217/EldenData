import type { ArchiveData } from "@/lib/types";
import ArchiveApp from "@/components/ArchiveApp";
import data from "@/data/enemies.json";

export default function HomePage() {
  return <ArchiveApp data={data as unknown as ArchiveData} />;
}
