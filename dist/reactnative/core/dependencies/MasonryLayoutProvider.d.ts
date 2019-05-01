import { Layout, LayoutManager } from "../layoutmanager/LayoutManager";
import { LayoutProvider, Dimension } from "./LayoutProvider";
export declare class MasonryLayoutProvider extends LayoutProvider {
    private _columnCount;
    constructor(getLayoutTypeForIndex: (index: number) => string | number, setLayoutForType: (type: string | number, dim: Dimension, index: number) => void, columnCount: number);
    newLayoutManager(renderWindowSize: Dimension, isHorizontal?: boolean, cachedLayouts?: Layout[]): LayoutManager;
}
