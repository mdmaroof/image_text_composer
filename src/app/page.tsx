import Canvas from "@/component/canvas";
import Layers from "@/component/layers";
import SelectorBox from "@/component/selector";
import { AppProvider } from "@/context/AppContext";

export default function Home() {
  return (
    <AppProvider>
      <div className="relative flex flex-col flex-1 gap-4 bg-gray-50 px-4 py-4 w-full h-dvh">
        <div className="flex flex-1 gap-4 h-full min-h-0">
          <Canvas />
          <Layers />
        </div>

        <SelectorBox />
      </div>
    </AppProvider>
  );
}
