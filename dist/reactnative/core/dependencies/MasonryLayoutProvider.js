"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var LayoutManager_1 = require("../layoutmanager/LayoutManager");
var LayoutProvider_1 = require("./LayoutProvider");
var MasonryLayoutManager = /** @class */ (function (_super) {
    __extends(MasonryLayoutManager, _super);
    function MasonryLayoutManager(columnCount, layoutProvider, renderWindowSize, isHorizontal, cachedLayouts) {
        if (isHorizontal === void 0) { isHorizontal = false; }
        var _this = _super.call(this, layoutProvider, renderWindowSize, isHorizontal, cachedLayouts) || this;
        _this._columnCount = columnCount;
        return _this;
    }
    MasonryLayoutManager.prototype.relayoutFromIndex = function (startIndex, itemCount) {
        // startIndex = this._locateFirstNeighbourIndex(startIndex);
        //TODO find a way to use start index
        startIndex = 0;
        var startX = 0;
        var startY = 0;
        var itemDim = { height: 0, width: 0 };
        var newLayouts = [];
        var columnLenghts = [];
        for (var idx = 0; idx < this._columnCount; idx++) {
            columnLenghts[idx] = 0;
        }
        var minColumnIdxFn = function (cols) { return cols.reduce(function (acc, val, idx, arr) { return (val < arr[acc] ? idx : acc); }, 0); };
        var colLenght = (this._isHorizontal ? this._window.height : this._window.width) / this._columnCount;
        for (var i = startIndex; i < itemCount; i++) {
            var oldLayout = this._layouts[i];
            if (oldLayout && oldLayout.isOverridden) {
                itemDim.height = oldLayout.height;
                itemDim.width = oldLayout.width;
            }
            else {
                this._layoutProvider.setComputedLayout(this._layoutProvider.getLayoutTypeForIndex(i), itemDim, i);
            }
            this.setMaxBounds(itemDim);
            var minColumnIdx = minColumnIdxFn(columnLenghts);
            startY = columnLenghts[minColumnIdx];
            startX = colLenght * minColumnIdx;
            // newLayouts.push({ x: startX, y: startY, height: itemDim.height, width: itemDim.width });
            newLayouts.push({
                x: startX,
                y: startY,
                height: itemDim.height,
                width: itemDim.width,
            });
            if (this._isHorizontal) {
                columnLenghts[minColumnIdx] += itemDim.width;
                if (startY + colLenght <= this._window.height) {
                    startY = startY + colLenght;
                }
                else {
                    startY = 0;
                }
                startX = columnLenghts[minColumnIdxFn(columnLenghts)];
            }
            else {
                columnLenghts[minColumnIdx] += itemDim.height;
            }
        }
        this._layouts = newLayouts;
        var maxColumnIdxFn = function () { return columnLenghts.reduce(function (acc, val, idx, arr) { return (arr[acc] > val ? acc : idx); }, 0); };
        if (this._isHorizontal) {
            this._totalHeight = this._window.height;
            this._totalWidth = columnLenghts[maxColumnIdxFn()];
        }
        else {
            this._totalWidth = this._window.width;
            this._totalHeight = columnLenghts[maxColumnIdxFn()];
        }
    };
    return MasonryLayoutManager;
}(LayoutManager_1.WrapGridLayoutManager));
var MasonryLayoutProvider = /** @class */ (function (_super) {
    __extends(MasonryLayoutProvider, _super);
    function MasonryLayoutProvider(getLayoutTypeForIndex, setLayoutForType, columnCount) {
        var _this = _super.call(this, getLayoutTypeForIndex, setLayoutForType) || this;
        _this._columnCount = columnCount;
        return _this;
    }
    MasonryLayoutProvider.prototype.newLayoutManager = function (renderWindowSize, isHorizontal, cachedLayouts) {
        this._lastLayoutManager = new MasonryLayoutManager(this._columnCount, this, renderWindowSize, isHorizontal, cachedLayouts);
        return this._lastLayoutManager;
    };
    return MasonryLayoutProvider;
}(LayoutProvider_1.LayoutProvider));
exports.MasonryLayoutProvider = MasonryLayoutProvider;
//# sourceMappingURL=MasonryLayoutProvider.js.map