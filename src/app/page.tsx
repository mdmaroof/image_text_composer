import Canvas from "@/component/canvas";
import Layers from "@/component/layers";
import SelectorBox from "@/component/selector";

export default function Home() {
  return (
    <div className="relative flex flex-col gap-4 px-4 py-4 w-full h-dvh">
      <div className="flex flex-1 gap-4">
        <Canvas />
        <Layers />
      </div>
      <SelectorBox />
    </div>
  );
}
