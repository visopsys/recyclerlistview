/***
 * Computes the positions and dimensions of items that will be rendered by the list. The output from this is utilized by viewability tracker to compute the
 * lists of visible/hidden item.
 */
import { Dimension, LayoutProvider } from "../dependencies/LayoutProvider";
import CustomError from "../exceptions/CustomError";

export abstract class LayoutManager {
    public getOffsetForIndex(index: number): Point {
        const layouts = this.getLayouts();
        if (layouts.length > index) {
            return { x: layouts[index].x, y: layouts[index].y };
        } else {
            throw new CustomError({
                message: "No layout available for index: " + index,
                type: "LayoutUnavailableException",
            });
        }
    }

    //You can ovveride this incase you want to override style in some cases e.g, say you want to enfore width but not height
    public getStyleOverridesForIndex(index: number): object | undefined {
        return undefined;
    }

    //Return the dimension of entire content inside the list
    public abstract getContentDimension(): Dimension;

    //Return all computed layouts as an array, frequently called, you are expected to return a cached array. Don't compute here.
    public abstract getLayouts(): Layout[];

    //RLV will call this method in case of mismatch with actual rendered dimensions in case of non deterministic rendering
    //You are expected to cache this value and prefer it over estimates provided
    //No need to relayout which RLV will trigger. You should only relayout when relayoutFromIndex is called.
    //Layout managers can choose to ignore the override requests like in case of grid layout where width changes
    //can be ignored for a vertical layout given it gets computed via the given column span.
    public abstract overrideLayout(index: number, dim: Dimension): boolean;

    //Recompute layouts from given index, compute heavy stuff should be here
    public abstract relayoutFromIndex(startIndex: number, itemCount: number): void;
}

export class WrapGridLayoutManager extends LayoutManager {
    private _layoutProvider: LayoutProvider;
    private _window: Dimension;
    private _totalHeight: number;
    private _totalWidth: number;
    private _isHorizontal: boolean;
    private _layouts: Layout[];
    private _columnCount: number;

    constructor(layoutProvider: LayoutProvider, renderWindowSize: Dimension, isHorizontal: boolean = false, cachedLayouts?: Layout[]) {
        super();
        this._layoutProvider = layoutProvider;
        this._window = renderWindowSize;
        this._totalHeight = 0;
        this._totalWidth = 0;
        this._isHorizontal = !!isHorizontal;
        this._layouts = cachedLayouts ? cachedLayouts : [];
        this._columnCount = 2;
    }

    public getContentDimension(): Dimension {
        return { height: this._totalHeight, width: this._totalWidth };
    }

    public getLayouts(): Layout[] {
        return this._layouts;
    }

    public getOffsetForIndex(index: number): Point {
        if (this._layouts.length > index) {
            return { x: this._layouts[index].x, y: this._layouts[index].y };
        } else {
            throw new CustomError({
                message: "No layout available for index: " + index,
                type: "LayoutUnavailableException",
            });
        }
    }

    public overrideLayout(index: number, dim: Dimension): boolean {
        const layout = this._layouts[index];
        if (layout) {
            layout.isOverridden = true;
            layout.width = dim.width;
            layout.height = dim.height;
        }
        return true;
    }

    public setMaxBounds(itemDim: Dimension): void {
        if (this._isHorizontal) {
            itemDim.height = Math.min(this._window.height, itemDim.height);
        } else {
            itemDim.width = Math.min(this._window.width, itemDim.width);
        }
    }

    //TODO:Talha laziliy calculate in future revisions
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

    private _pointDimensionsToRect(itemRect: Layout): void {
        if (this._isHorizontal) {
            this._totalWidth = itemRect.x;
        } else {
            this._totalHeight = itemRect.y;
        }
    }

    private _setFinalDimensions(maxBound: number): void {
        if (this._isHorizontal) {
            this._totalHeight = this._window.height;
            this._totalWidth += maxBound;
        } else {
            this._totalWidth = this._window.width;
            this._totalHeight += maxBound;
        }
    }

    private _locateFirstNeighbourIndex(startIndex: number): number {
        if (startIndex === 0) {
            return 0;
        }
        let i = startIndex - 1;
        for (; i >= 0; i--) {
            if (this._isHorizontal) {
                if (this._layouts[i].y === 0) {
                    break;
                }
            } else if (this._layouts[i].x === 0) {
                break;
            }
        }
        return i;
    }

    private _checkBounds(itemX: number, itemY: number, itemDim: Dimension, isHorizontal: boolean): boolean {
        return isHorizontal ? (itemY + itemDim.height <= this._window.height) : (itemX + itemDim.width <= this._window.width);
    }
}

export interface Layout extends Dimension, Point {
    isOverridden?: boolean;
    type: string | number;
}
export interface Point {
    x: number;
    y: number;
}
