import { Layout, WrapGridLayoutManager, LayoutManager } from "../layoutmanager/LayoutManager";
import { LayoutProvider, Dimension } from "./LayoutProvider";

class MasonryLayoutManager extends WrapGridLayoutManager {
    private _columnCount: number;

    constructor(columnCount: number, layoutProvider: LayoutProvider, renderWindowSize: Dimension, isHorizontal: boolean = false, cachedLayouts?: Layout[]) {
        super(layoutProvider, renderWindowSize, isHorizontal, cachedLayouts);
        this._columnCount = columnCount;
    }

    public relayoutFromIndex(startIndex: number, itemCount: number): void {
        // startIndex = this._locateFirstNeighbourIndex(startIndex);
        //TODO find a way to use start index
        startIndex = 0;

        let startX = 0;
        let startY = 0;

        const itemDim = { height: 0, width: 0 };

        const newLayouts = [];
        const columnLenghts: number[] = [];
        for (let idx = 0; idx < this._columnCount; idx++) {
          columnLenghts[idx] = 0;
        }
        const minColumnIdxFn = (cols: number[]) => cols.reduce((acc, val, idx, arr) => (val < arr[acc] ? idx : acc), 0);
        const colLenght = (this._isHorizontal ? this._window.height : this._window.width) / this._columnCount;
        for (let i = startIndex; i < itemCount; i++) {
            const oldLayout = this._layouts[i];
            if (oldLayout && oldLayout.isOverridden) {
                itemDim.height = oldLayout.height;
                itemDim.width = oldLayout.width;
            } else {
                this._layoutProvider.setComputedLayout(this._layoutProvider.getLayoutTypeForIndex(i), itemDim, i);
            }
            this.setMaxBounds(itemDim);

            const minColumnIdx = minColumnIdxFn(columnLenghts);
            startY = columnLenghts[minColumnIdx];
            startX = colLenght * minColumnIdx;

            // newLayouts.push({ x: startX, y: startY, height: itemDim.height, width: itemDim.width });
            newLayouts.push(<Layout> {
                x: startX,
                y: startY,
                height: itemDim.height,
                width: itemDim.width,
              }
            )

            if (this._isHorizontal) {
                columnLenghts[minColumnIdx] += itemDim.width;
                if (startY + colLenght <= this._window.height) {
                    startY = startY + colLenght;
                } else {
                    startY = 0;
                }
                startX = columnLenghts[minColumnIdxFn(columnLenghts)];
            } else {
                columnLenghts[minColumnIdx] += itemDim.height;
            }
        }
        this._layouts = newLayouts;

        const maxColumnIdxFn = () => columnLenghts.reduce((acc, val, idx, arr) => (arr[acc] > val ? acc : idx), 0);

        if (this._isHorizontal) {
            this._totalHeight = this._window.height;
            this._totalWidth = columnLenghts[maxColumnIdxFn()];
        } else {
            this._totalWidth = this._window.width;
            this._totalHeight = columnLenghts[maxColumnIdxFn()];
        }
    }
}

export class MasonryLayoutProvider extends LayoutProvider {
	private _columnCount: number;

	constructor(getLayoutTypeForIndex: (index: number) => string | number, setLayoutForType: (type: string | number, dim: Dimension, index: number) => void, columnCount: number) {
		super(getLayoutTypeForIndex, setLayoutForType);
		this._columnCount = columnCount;
	}

    public newLayoutManager(renderWindowSize: Dimension, isHorizontal?: boolean, cachedLayouts?: Layout[]): LayoutManager {
        this._lastLayoutManager = new MasonryLayoutManager(this._columnCount, this, renderWindowSize, isHorizontal, cachedLayouts);
        return this._lastLayoutManager;
    }
}