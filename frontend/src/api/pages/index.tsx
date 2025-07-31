import dynamic from "next/dynamic";
const FolderTreeUI = dynamic(() => import("@/views/FolderTreeUI"), { ssr: false });

export default function Home() {
  return <FolderTreeUI />;
}
