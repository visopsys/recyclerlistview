/***
 * Computes the positions and dimensions of items that will be rendered by the list. The output from this is utilized by viewability tracker to compute the
 * lists of visible/hidden item.
 */
import { Dimension, LayoutProvider } from "../dependencies/LayoutProvider";
export declare abstract class LayoutManager {
    getOffsetForIndex(index: number): Point;
    getStyleOverridesForIndex(index: number): object | undefined;
    abstract getContentDimension(): Dimension;
    abstract getLayouts(): Layout[];
    abstract overrideLayout(index: number, dim: Dimension): boolean;
    abstract relayoutFromIndex(startIndex: number, itemCount: number): void;
}
export declare class WrapGridLayoutManager extends LayoutManager {
    protected _layoutProvider: LayoutProvider;
    protected _window: Dimension;
    protected _totalHeight: number;
    protected _totalWidth: number;
    protected _isHorizontal: boolean;
    protected _layouts: Layout[];
    constructor(layoutProvider: LayoutProvider, renderWindowSize: Dimension, isHorizontal?: boolean, cachedLayouts?: Layout[]);
    getContentDimension(): Dimension;
    getLayouts(): Layout[];
    getOffsetForIndex(index: number): Point;
    overrideLayout(index: number, dim: Dimension): boolean;
    setMaxBounds(itemDim: Dimension): void;
    relayoutFromIndex(startIndex: number, itemCount: number): void;
    private _pointDimensionsToRect(itemRect);
    private _setFinalDimensions(maxBound);
    private _locateFirstNeighbourIndex(startIndex);
    private _checkBounds(itemX, itemY, itemDim, isHorizontal);
}
export interface Layout extends Dimension, Point {
    isOverridden?: boolean;
    type: string | number;
}
export interface Point {
    x: number;
    y: number;
}
